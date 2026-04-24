#include "ClaustrophobiaEffect.h"
#include "../Player/PhobiaPlayerCharacter.h"
#include "Camera/CameraComponent.h"
#include "Kismet/GameplayStatics.h"
#include "Components/AudioComponent.h"
#include "DrawDebugHelpers.h"

void UClaustrophobiaEffect::TickComponent(float DeltaTime, ELevelTick TickType,
                                           FActorComponentTickFunction* ThisTickFunction)
{
    Super::TickComponent(DeltaTime, TickType, ThisTickFunction);

    float Tightness = MeasureTightness();
    Intensity = FMath::FInterpTo(Intensity, Tightness, DeltaTime, 2.f);

    UpdateFOV(DeltaTime);
    UpdateHeartbeat();
    UpdatePlayerSpeed();

    // Crujidos de pared
    WallCreakTimer += DeltaTime;
    float CreakInterval = FMath::Lerp(25.f, 5.f, Intensity);
    if (WallCreakTimer >= CreakInterval && WallCreakSound)
    {
        WallCreakTimer = 0.f;
        UGameplayStatics::PlaySoundAtLocation(this, WallCreakSound,
            UGameplayStatics::GetPlayerPawn(GetWorld(), 0)->GetActorLocation(),
            FMath::RandRange(0.4f, 0.9f));
    }
}

float UClaustrophobiaEffect::MeasureTightness() const
{
    APawn* Player = UGameplayStatics::GetPlayerPawn(GetWorld(), 0);
    if (!Player) return 0.f;

    FVector Origin = Player->GetActorLocation();
    FCollisionQueryParams Params;
    Params.AddIgnoredActor(Player);

    // Medir 4 direcciones horizontales
    int32 Blocked = 0;
    TArray<FVector> Dirs = { FVector::ForwardVector, FVector::BackwardVector,
                              FVector::RightVector, FVector::LeftVector };
    for (FVector Dir : Dirs)
    {
        FHitResult Hit;
        if (GetWorld()->LineTraceSingleByChannel(Hit, Origin, Origin + Dir * OpenSpaceCheckRadius,
                                                  ECC_WorldStatic, Params))
            Blocked++;
    }
    return (float)Blocked / 4.f;
}

void UClaustrophobiaEffect::UpdateFOV(float DeltaTime)
{
    APlayerController* PC = UGameplayStatics::GetPlayerController(GetWorld(), 0);
    if (!PC) return;

    APhobiaPlayerCharacter* Player = Cast<APhobiaPlayerCharacter>(PC->GetPawn());
    if (!Player || !Player->FPSCamera) return;

    float TargetFOV = FMath::Lerp(NormalFOV, MinFOV, Intensity);
    float NewFOV = FMath::FInterpTo(Player->FPSCamera->FieldOfView, TargetFOV, DeltaTime, 3.f);
    Player->FPSCamera->SetFieldOfView(NewFOV);
}

void UClaustrophobiaEffect::UpdateHeartbeat()
{
    if (Intensity > 0.3f && !HeartbeatAudio)
    {
        USoundBase* Clip = Intensity > 0.6f ? HeartbeatFastSound : HeartbeatSlowSound;
        if (Clip)
        {
            HeartbeatAudio = UGameplayStatics::SpawnSoundAtLocation(GetWorld(), Clip,
                UGameplayStatics::GetPlayerPawn(GetWorld(),0)->GetActorLocation(),
                FRotator::ZeroRotator, 1.f, 1.f, 0.f, nullptr, nullptr, false);
            if (HeartbeatAudio) HeartbeatAudio->bAutoDestroy = false;
        }
    }
    else if (Intensity <= 0.3f && HeartbeatAudio)
    {
        HeartbeatAudio->Stop();
        HeartbeatAudio->DestroyComponent();
        HeartbeatAudio = nullptr;
    }

    if (HeartbeatAudio)
        HeartbeatAudio->SetVolumeMultiplier(Intensity);
}

void UClaustrophobiaEffect::UpdatePlayerSpeed()
{
    APhobiaPlayerCharacter* Player = Cast<APhobiaPlayerCharacter>(
        UGameplayStatics::GetPlayerPawn(GetWorld(), 0));
    if (!Player) return;
    Player->SpeedMultiplier = Intensity >= 0.5f ? TightSpeedMultiplier : 1.f;
}

void UClaustrophobiaEffect::ApplyEffect(float InIntensity)
{
    // Post-process (vignette pulsante) se controla desde Blueprint
    // leyendo la propiedad Intensity de este componente
}
