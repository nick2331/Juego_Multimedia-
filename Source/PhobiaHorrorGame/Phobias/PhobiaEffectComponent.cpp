#include "PhobiaEffectComponent.h"
#include "Engine/PostProcessVolume.h"
#include "EngineUtils.h"

UPhobiaEffectComponent::UPhobiaEffectComponent()
{
    PrimaryComponentTick.bCanEverTick = true;
    PrimaryComponentTick.bStartWithTickEnabled = false;
}

void UPhobiaEffectComponent::BeginPlay()
{
    Super::BeginPlay();
}

void UPhobiaEffectComponent::TickComponent(float DeltaTime, ELevelTick TickType,
                                            FActorComponentTickFunction* ThisTickFunction)
{
    Super::TickComponent(DeltaTime, TickType, ThisTickFunction);
    if (bIsActive) ApplyEffect(Intensity);
}

void UPhobiaEffectComponent::ActivateEffect()
{
    bIsActive = true;
    PrimaryActorTick.bCanEverTick = true;
    SetComponentTickEnabled(true);
}

void UPhobiaEffectComponent::DeactivateEffect()
{
    bIsActive = false;
    SetComponentTickEnabled(false);
}

void UPhobiaEffectComponent::SetIntensity(float NewIntensity)
{
    Intensity = FMath::Clamp(NewIntensity, 0.f, 1.f);
    ApplyEffect(Intensity);
}

APostProcessVolume* UPhobiaEffectComponent::GetPostProcessVolume() const
{
    for (TActorIterator<APostProcessVolume> It(GetWorld()); It; ++It)
    {
        if (It->bUnbound) return *It;
    }
    return nullptr;
}
