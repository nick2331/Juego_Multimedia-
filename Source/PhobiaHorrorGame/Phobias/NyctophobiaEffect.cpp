#include "NyctophobiaEffect.h"
#include "../Player/PhobiaPlayerCharacter.h"
#include "../Player/FlashlightComponent.h"
#include "Kismet/GameplayStatics.h"
#include "Components/SpotLightComponent.h"

void UNyctophobiaEffect::ActivateEffect()
{
    Super::ActivateEffect();

    // Luz ambiente casi negra
    GetWorld()->GetWorldSettings()->SetTraceDistance(0.f);
    RenderSettings_SetAmbient(AmbientColor); // Ver nota Blueprint

    // Niebla
    GetWorld()->GetWorldSettings();
    // Configurar fog via código (en UE5 se recomienda via PostProcessVolume Blueprint)

    ConfigureFlashlight();
}

void UNyctophobiaEffect::ConfigureFlashlight()
{
    APhobiaPlayerCharacter* Player = Cast<APhobiaPlayerCharacter>(
        UGameplayStatics::GetPlayerPawn(GetWorld(), 0));
    if (!Player || !Player->FlashlightComp) return;

    Player->FlashlightComp->DrainMultiplier = BatteryDrainMultiplier;

    if (Player->FlashlightComp->SpotLight)
    {
        Player->FlashlightComp->SpotLight->SetAttenuationRadius(FlashlightRange);
        Player->FlashlightComp->SpotLight->SetOuterConeAngle(FlashlightAngle);
    }
}

void UNyctophobiaEffect::TickComponent(float DeltaTime, ELevelTick TickType,
                                        FActorComponentTickFunction* ThisTickFunction)
{
    Super::TickComponent(DeltaTime, TickType, ThisTickFunction);

    CheckPlayerInDark();
    AnimateShadows();
    PlayDarknessSound(DeltaTime);
}

void UNyctophobiaEffect::CheckPlayerInDark()
{
    APhobiaPlayerCharacter* Player = Cast<APhobiaPlayerCharacter>(
        UGameplayStatics::GetPlayerPawn(GetWorld(), 0));
    if (!Player) return;

    bool bInDark = Player->FlashlightComp && !Player->FlashlightComp->IsFlashlightOn();
    float TargetIntensity = bInDark ? 1.f : 0.f;
    Intensity = FMath::FInterpTo(Intensity, TargetIntensity, GetWorld()->GetDeltaSeconds(), 1.5f);
}

void UNyctophobiaEffect::AnimateShadows()
{
    ShadowMoveTimer += GetWorld()->GetDeltaSeconds();
    if (ShadowMoveTimer < 2.5f) return;
    ShadowMoveTimer = 0.f;

    APlayerController* PC = UGameplayStatics::GetPlayerController(GetWorld(), 0);
    if (!PC) return;

    for (AActor* Shadow : ShadowActors)
    {
        if (!Shadow) continue;

        // Mover sólo si no está en el campo de visión
        FVector2D ScreenPos;
        bool bOnScreen = PC->ProjectWorldLocationToScreen(Shadow->GetActorLocation(), ScreenPos, true);

        if (!bOnScreen)
        {
            APawn* Player = UGameplayStatics::GetPlayerPawn(GetWorld(), 0);
            if (!Player) continue;

            FVector Offset = FMath::VRand() * ShadowMoveRadius;
            Offset.Z = 0.f;
            Shadow->SetActorLocation(Player->GetActorLocation() + Offset);
        }
    }
}

void UNyctophobiaEffect::PlayDarknessSound(float DeltaTime)
{
    if (Intensity < 0.3f) return;
    DarkSoundTimer += DeltaTime;
    float Interval = FMath::Lerp(15.f, 5.f, Intensity);

    if (DarkSoundTimer >= Interval && DarknessSounds.Num() > 0)
    {
        DarkSoundTimer = 0.f;
        USoundBase* S = DarknessSounds[FMath::RandRange(0, DarknessSounds.Num()-1)];
        UGameplayStatics::PlaySoundAtLocation(this, S,
            UGameplayStatics::GetPlayerPawn(GetWorld(),0)->GetActorLocation(),
            FMath::RandRange(0.3f, 0.7f));
    }
}

void UNyctophobiaEffect::ApplyEffect(float InIntensity)
{
    // Film grain y vignette se controlan desde Blueprint leyendo Intensity
}
