#include "EnemyBaseCharacter.h"
#include "Components/AudioComponent.h"
#include "Kismet/GameplayStatics.h"
#include "AIController.h"
#include "BrainComponent.h"

AEnemyBaseCharacter::AEnemyBaseCharacter()
{
    PrimaryActorTick.bCanEverTick = true;
    Tags.Add(FName("Enemy"));
}

void AEnemyBaseCharacter::BeginPlay()
{
    Super::BeginPlay();
    CurrentHealth = MaxHealth;
    AudioComp = FindComponentByClass<UAudioComponent>();
}

void AEnemyBaseCharacter::TakeDamage_Enemy(float Damage)
{
    if (CurrentState == EEnemyState::Dead) return;
    CurrentHealth -= Damage;
    if (CurrentHealth <= 0.f) Die();
}

void AEnemyBaseCharacter::SetEnemyState(EEnemyState NewState)
{
    if (CurrentState == EEnemyState::Dead) return;
    CurrentState = NewState;
    OnStateChanged.Broadcast(NewState);
}

void AEnemyBaseCharacter::PerformAttack()
{
    if (AttackSound)
        UGameplayStatics::PlaySoundAtLocation(this, AttackSound, GetActorLocation());

    // Buscar jugador en rango
    APawn* Player = UGameplayStatics::GetPlayerPawn(this, 0);
    if (!Player) return;

    float Dist = FVector::Dist(GetActorLocation(), Player->GetActorLocation());
    if (Dist <= AttackRange)
    {
        ACharacter* PlayerChar = Cast<ACharacter>(Player);
        // Llamar TakeDamage_Phobia si es nuestro personaje
        if (PlayerChar)
        {
            auto* PHC = Cast<ACharacter>(Player);
            if (PHC) PHC->TakeDamage(AttackDamage, FDamageEvent(), GetController(), this);
        }
    }
}

void AEnemyBaseCharacter::Die()
{
    SetEnemyState(EEnemyState::Dead);
    if (DeathSound) UGameplayStatics::PlaySoundAtLocation(this, DeathSound, GetActorLocation());

    // Detener Behavior Tree
    AAIController* AIC = Cast<AAIController>(GetController());
    if (AIC && AIC->BrainComponent)
        AIC->BrainComponent->StopLogic("Dead");

    GetCharacterMovement()->DisableMovement();
    SetActorEnableCollision(false);
    SetLifeSpan(5.f);
}
