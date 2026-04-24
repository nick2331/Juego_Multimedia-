#include "SpiderCharacter.h"
#include "WebProjectileActor.h"
#include "NiagaraFunctionLibrary.h"
#include "NiagaraComponent.h"
#include "Kismet/GameplayStatics.h"
#include "GameFramework/CharacterMovementComponent.h"
#include "../Player/PhobiaPlayerCharacter.h"

ASpiderCharacter::ASpiderCharacter()
{
    PrimaryActorTick.bCanEverTick = true;

    // La araña usa movimiento personalizado — puede trepar (configurar en BP)
    GetCharacterMovement()->MaxWalkSpeed = 400.f;
    GetCharacterMovement()->bOrientRotationToMovement = true;
    GetCharacterMovement()->RotationRate = FRotator(0.f, 640.f, 0.f);
}

void ASpiderCharacter::BeginPlay()
{
    Super::BeginPlay();
    WebCooldownTimer = WebCooldown; // Puede disparar desde el inicio
}

void ASpiderCharacter::Tick(float DeltaTime)
{
    Super::Tick(DeltaTime);
    UpdateTimers(DeltaTime);
}

void ASpiderCharacter::UpdateTimers(float DeltaTime)
{
    WebCooldownTimer = FMath::Min(WebCooldown, WebCooldownTimer + DeltaTime);
}

void ASpiderCharacter::ShootWeb()
{
    if (!CanShootWeb() || WebProjectileClass == nullptr) return;
    WebCooldownTimer = 0.f;

    if (WebShootSound)
        UGameplayStatics::PlaySoundAtLocation(this, WebShootSound, GetActorLocation());

    // Obtener posición del socket de disparo
    FVector ShootOrigin = GetMesh()->GetSocketLocation(WebShootSocketName);
    APawn* Player = UGameplayStatics::GetPlayerPawn(this, 0);
    if (!Player) return;

    FVector Dir = (Player->GetActorLocation() - ShootOrigin).GetSafeNormal();
    FRotator SpawnRot = Dir.Rotation();

    FActorSpawnParameters Params;
    Params.Instigator = this;
    Params.SpawnCollisionHandlingOverride = ESpawnActorCollisionHandlingMethod::AlwaysSpawn;

    AWebProjectileActor* Proj = GetWorld()->SpawnActor<AWebProjectileActor>(
        WebProjectileClass, ShootOrigin, SpawnRot, Params);

    if (Proj)
    {
        Proj->Initialize(Dir, WebSlowDuration);
        if (WebTrailFX)
            UNiagaraFunctionLibrary::SpawnSystemAttached(WebTrailFX, Proj->GetRootComponent(),
                NAME_None, FVector::ZeroVector, FRotator::ZeroRotator,
                EAttachLocation::SnapToTarget, true);
    }
}

void ASpiderCharacter::DropFromCeiling(FVector TargetLocation)
{
    if (!bCanDropFromCeiling || bIsDropping) return;
    bIsDropping = true;

    // Teletransportar arriba del objetivo
    FVector DropPos = TargetLocation + FVector(0.f, 0.f, 350.f);
    SetActorLocation(DropPos);

    if (HissSound)
        UGameplayStatics::PlaySoundAtLocation(this, HissSound, GetActorLocation(), 1.f);

    // Caer sobre el jugador
    LaunchCharacter(FVector(0.f, 0.f, -600.f), true, true);

    // Reproducir FX de aterrizaje con delay
    FTimerHandle LandTimer;
    GetWorldTimerManager().SetTimer(LandTimer, [this]()
    {
        bIsDropping = false;
        SetEnemyState(EEnemyState::Chase);
        if (LandFX)
            UNiagaraFunctionLibrary::SpawnSystemAtLocation(GetWorld(), LandFX, GetActorLocation());
    }, 0.8f, false);
}

void ASpiderCharacter::OnChaseStarted()
{
    if (HissSound)
        UGameplayStatics::PlaySoundAtLocation(this, HissSound, GetActorLocation(), 0.8f);
    GetCharacterMovement()->MaxWalkSpeed = ChaseSpeed;
}

void ASpiderCharacter::PerformAttack()
{
    Super::PerformAttack();

    // Animación de mordida se maneja en el Behavior Tree Animation Blueprint
    APawn* Player = UGameplayStatics::GetPlayerPawn(this, 0);
    if (!Player) return;

    float Dist = FVector::Dist(GetActorLocation(), Player->GetActorLocation());
    if (Dist <= AttackRange)
    {
        APhobiaPlayerCharacter* PHC = Cast<APhobiaPlayerCharacter>(Player);
        if (PHC) PHC->TakeDamage_Phobia(AttackDamage);
    }
}
