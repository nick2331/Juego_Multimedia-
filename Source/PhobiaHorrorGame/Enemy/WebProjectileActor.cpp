#include "WebProjectileActor.h"
#include "Components/SphereComponent.h"
#include "Components/StaticMeshComponent.h"
#include "GameFramework/ProjectileMovementComponent.h"
#include "../Player/PhobiaPlayerCharacter.h"
#include "Kismet/GameplayStatics.h"

AWebProjectileActor::AWebProjectileActor()
{
    CollisionComp = CreateDefaultSubobject<USphereComponent>(TEXT("SphereComp"));
    CollisionComp->InitSphereRadius(20.f);
    CollisionComp->SetCollisionProfileName(TEXT("Projectile"));
    CollisionComp->OnComponentHit.AddDynamic(this, &AWebProjectileActor::OnHit);
    RootComponent = CollisionComp;

    MeshComp = CreateDefaultSubobject<UStaticMeshComponent>(TEXT("MeshComp"));
    MeshComp->SetupAttachment(RootComponent);
    MeshComp->SetCollisionEnabled(ECollisionEnabled::NoCollision);

    MovementComp = CreateDefaultSubobject<UProjectileMovementComponent>(TEXT("MovementComp"));
    MovementComp->InitialSpeed = ProjectileSpeed;
    MovementComp->MaxSpeed = ProjectileSpeed;
    MovementComp->bRotationFollowsVelocity = true;
    MovementComp->ProjectileGravityScale = 0.2f;

    InitialLifeSpan = Lifetime;
}

void AWebProjectileActor::BeginPlay()
{
    Super::BeginPlay();
}

void AWebProjectileActor::Initialize(FVector Direction, float InSlowDuration)
{
    SlowDuration = InSlowDuration;
    MovementComp->Velocity = Direction * ProjectileSpeed;
}

void AWebProjectileActor::OnHit(UPrimitiveComponent* HitComp, AActor* OtherActor,
                                  UPrimitiveComponent* OtherComp, FVector NormalImpulse,
                                  const FHitResult& Hit)
{
    if (bHasHit) return;

    APhobiaPlayerCharacter* Player = Cast<APhobiaPlayerCharacter>(OtherActor);
    if (Player)
    {
        bHasHit = true;
        // Ralentizar al jugador
        Player->SpeedMultiplier = 0.3f;

        // Restaurar velocidad después del slow
        FTimerHandle SlowTimer;
        GetWorldTimerManager().SetTimer(SlowTimer, [Player]()
        {
            if (Player) Player->SpeedMultiplier = 1.f;
        }, SlowDuration, false);
    }

    SetActorEnableCollision(false);
    MeshComp->SetVisibility(false);
    SetLifeSpan(2.f);
}
