#include "SanityComponent.h"
#include "PhobiaPlayerCharacter.h"
#include "FlashlightComponent.h"
#include "Components/AudioComponent.h"
#include "Kismet/GameplayStatics.h"
#include "../Enemy/EnemyBaseCharacter.h"
#include "EngineUtils.h"

USanityComponent::USanityComponent()
{
    PrimaryComponentTick.bCanEverTick = true;
}

void USanityComponent::BeginPlay()
{
    Super::BeginPlay();
    CurrentSanity = MaxSanity;
    AudioComp = GetOwner()->FindComponentByClass<UAudioComponent>();
}

void USanityComponent::TickComponent(float DeltaTime, ELevelTick TickType,
                                      FActorComponentTickFunction* ThisTickFunction)
{
    Super::TickComponent(DeltaTime, TickType, ThisTickFunction);

    bool bLosingMind = false;

    if (IsPlayerInDark())
    {
        LoseSanity(SanityLossInDark * DeltaTime);
        bLosingMind = true;
    }

    if (IsEnemyNearby())
    {
        LoseSanity(SanityLossNearEnemy * DeltaTime);
        bLosingMind = true;
    }

    if (!bLosingMind)
    {
        RegenTimer += DeltaTime;
        if (RegenTimer >= SanityRegenDelay)
        {
            CurrentSanity = FMath::Min(MaxSanity, CurrentSanity + SanityRegenRate * DeltaTime);
            OnSanityChanged.Broadcast(GetSanityPercent());
        }
    }
    else
    {
        RegenTimer = 0.f;
    }

    if (IsLowSanity()) TryPlayHallucination();
}

void USanityComponent::LoseSanity(float Amount)
{
    CurrentSanity = FMath::Max(0.f, CurrentSanity - Amount);
    RegenTimer = 0.f;
    OnSanityChanged.Broadcast(GetSanityPercent());

    if (CurrentSanity <= 0.f)
    {
        OnSanityDepleted.Broadcast();
        // Matar al jugador por terror
        APhobiaPlayerCharacter* Player = Cast<APhobiaPlayerCharacter>(GetOwner());
        if (Player) Player->TakeDamage_Phobia(999.f);
    }
}

void USanityComponent::RestoreSanity(float Amount)
{
    CurrentSanity = FMath::Min(MaxSanity, CurrentSanity + Amount);
    OnSanityChanged.Broadcast(GetSanityPercent());
}

bool USanityComponent::IsPlayerInDark() const
{
    APhobiaPlayerCharacter* Player = Cast<APhobiaPlayerCharacter>(GetOwner());
    if (!Player) return false;
    UFlashlightComponent* FL = Player->FlashlightComp;
    return FL && !FL->IsFlashlightOn();
}

bool USanityComponent::IsEnemyNearby() const
{
    APawn* OwnerPawn = Cast<APawn>(GetOwner());
    if (!OwnerPawn) return false;

    for (TActorIterator<AEnemyBaseCharacter> It(GetWorld()); It; ++It)
    {
        float Dist = FVector::Dist(OwnerPawn->GetActorLocation(), It->GetActorLocation());
        if (Dist <= EnemyDetectionRadius) return true;
    }
    return false;
}

void USanityComponent::TryPlayHallucination()
{
    if (HallucinationSounds.Num() == 0) return;

    HallucinationTimer += GetWorld()->GetDeltaSeconds();
    float Interval = FMath::Lerp(20.f, 6.f, 1.f - GetSanityPercent());

    if (HallucinationTimer >= Interval)
    {
        HallucinationTimer = 0.f;
        USoundBase* Sound = HallucinationSounds[FMath::RandRange(0, HallucinationSounds.Num()-1)];
        UGameplayStatics::PlaySoundAtLocation(this, Sound, GetOwner()->GetActorLocation(),
                                               FMath::RandRange(0.3f, 0.7f));
    }
}
