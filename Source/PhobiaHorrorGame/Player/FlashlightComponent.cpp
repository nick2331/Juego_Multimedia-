#include "FlashlightComponent.h"
#include "Components/SpotLightComponent.h"
#include "Kismet/GameplayStatics.h"

UFlashlightComponent::UFlashlightComponent()
{
    PrimaryComponentTick.bCanEverTick = true;
}

void UFlashlightComponent::BeginPlay()
{
    Super::BeginPlay();
    CurrentBattery = MaxBattery;

    if (SpotLight)
    {
        SpotLight->SetIntensity(NormalIntensity);
        SpotLight->SetAttenuationRadius(NormalRange);
    }
}

void UFlashlightComponent::TickComponent(float DeltaTime, ELevelTick TickType,
                                          FActorComponentTickFunction* ThisTickFunction)
{
    Super::TickComponent(DeltaTime, TickType, ThisTickFunction);

    if (!bIsOn || CurrentBattery <= 0.f) return;

    DrainBattery(DeltaTime);

    if (bIsFlickering) UpdateFlicker(DeltaTime);
}

void UFlashlightComponent::Toggle()
{
    bIsOn = !bIsOn;
    if (SpotLight) SpotLight->SetVisibility(bIsOn && CurrentBattery > 0.f);
    if (ToggleSound) UGameplayStatics::PlaySoundAtLocation(this, ToggleSound, GetOwner()->GetActorLocation(), 0.7f);
}

void UFlashlightComponent::DrainBattery(float DeltaTime)
{
    CurrentBattery = FMath::Max(0.f, CurrentBattery - DrainRate * DrainMultiplier * DeltaTime);
    OnBatteryChanged.Broadcast(GetBatteryPercent());

    // Reducir intensidad con la batería
    if (SpotLight)
    {
        float BatteryRatio = GetBatteryPercent();
        SpotLight->SetIntensity(FMath::Lerp(NormalIntensity * 0.2f, NormalIntensity, BatteryRatio));
    }

    if (CurrentBattery <= FlickerThreshold && !bIsFlickering)
        StartFlicker();

    if (CurrentBattery <= 0.f)
        KillFlashlight();
}

void UFlashlightComponent::StartFlicker()
{
    bIsFlickering = true;
}

void UFlashlightComponent::UpdateFlicker(float DeltaTime)
{
    FlickerTimer += DeltaTime;
    float FlickerInterval = FMath::RandRange(0.03f, 0.15f);

    if (FlickerTimer >= FlickerInterval)
    {
        FlickerTimer = 0.f;
        if (SpotLight)
            SpotLight->SetIntensity(FMath::RandRange(NormalIntensity * 0.1f, NormalIntensity * 0.8f));
    }
}

void UFlashlightComponent::KillFlashlight()
{
    bIsOn = false;
    bIsFlickering = false;
    if (SpotLight) SpotLight->SetVisibility(false);
    if (DeadSound) UGameplayStatics::PlaySoundAtLocation(this, DeadSound, GetOwner()->GetActorLocation());
    OnFlashlightDied.Broadcast();
}

void UFlashlightComponent::Recharge(float Amount)
{
    CurrentBattery = FMath::Min(MaxBattery, CurrentBattery + Amount);
    OnBatteryChanged.Broadcast(GetBatteryPercent());

    if (CurrentBattery > FlickerThreshold)
    {
        bIsFlickering = false;
        if (SpotLight) SpotLight->SetIntensity(NormalIntensity);
    }

    if (CurrentBattery > 0.f && !bIsOn)
    {
        bIsOn = true;
        if (SpotLight) SpotLight->SetVisibility(true);
    }
}
