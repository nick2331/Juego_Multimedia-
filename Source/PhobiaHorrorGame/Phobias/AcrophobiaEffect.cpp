#include "AcrophobiaEffect.h"
#include "../Player/PhobiaPlayerCharacter.h"
#include "Camera/CameraComponent.h"
#include "Kismet/GameplayStatics.h"
#include "Components/AudioComponent.h"
#include "GameFramework/CharacterMovementComponent.h"

void UAcrophobiaEffect::ActivateEffect()
{
    Super::ActivateEffect();

    if (WindSound)
    {
        WindAudioComp = UGameplayStatics::SpawnSoundAtLocation(GetWorld(), WindSound,
            UGameplayStatics::GetPlayerPawn(GetWorld(),0)->GetActorLocation(),
            FRotator::ZeroRotator, 0.f, 1.f, 0.f, nullptr, nullptr, false);
        if (WindAudioComp) WindAudioComp->bAutoDestroy = false;
    }
}

void UAcrophobiaEffect::TickComponent(float DeltaTime, ELevelTick TickType,
                                       FActorComponentTickFunction* ThisTickFunction)
{
    Super::TickComponent(DeltaTime, TickType, ThisTickFunction);

    Intensity = FMath::FInterpTo(Intensity, GetHeightRatio(), DeltaTime, 2.f);

    UpdateCameraSway(DeltaTime);
    UpdateFOV(DeltaTime);
    UpdateWind();
    CheckFallDamage();
}

float UAcrophobiaEffect::GetHeightRatio() const
{
    APawn* Player = UGameplayStatics::GetPlayerPawn(GetWorld(), 0);
    if (!Player) return 0.f;
    float Height = Player->GetActorLocation().Z - GroundLevel;
    return FMath::Clamp(Height / MaxHeightEffect, 0.f, 1.f);
}

void UAcrophobiaEffect::UpdateCameraSway(float DeltaTime)
{
    if (Intensity < 0.2f) return;

    APhobiaPlayerCharacter* Player = Cast<APhobiaPlayerCharacter>(
        UGameplayStatics::GetPlayerPawn(GetWorld(), 0));
    if (!Player || !Player->FPSCamera) return;

    SwayTimer += DeltaTime * CameraSwaySpeed;
    float Sway = FMath::Sin(SwayTimer) * CameraSwayAmount * Intensity;
    FRotator CamRot = Player->FPSCamera->GetRelativeRotation();
    CamRot.Roll = Sway;
    Player->FPSCamera->SetRelativeRotation(CamRot);
}

void UAcrophobiaEffect::UpdateFOV(float DeltaTime)
{
    APhobiaPlayerCharacter* Player = Cast<APhobiaPlayerCharacter>(
        UGameplayStatics::GetPlayerPawn(GetWorld(), 0));
    if (!Player || !Player->FPSCamera) return;

    float BaseFOV = 90.f;
    float TargetFOV = BaseFOV - VertigoFOVReduction * Intensity;
    float NewFOV = FMath::FInterpTo(Player->FPSCamera->FieldOfView, TargetFOV, DeltaTime, 3.f);
    Player->FPSCamera->SetFieldOfView(NewFOV);
}

void UAcrophobiaEffect::UpdateWind()
{
    if (WindAudioComp)
    {
        APawn* Player = UGameplayStatics::GetPlayerPawn(GetWorld(), 0);
        if (Player) WindAudioComp->SetWorldLocation(Player->GetActorLocation());
        WindAudioComp->SetVolumeMultiplier(Intensity * 0.85f);
    }
}

void UAcrophobiaEffect::CheckFallDamage()
{
    APawn* Player = UGameplayStatics::GetPlayerPawn(GetWorld(), 0);
    if (!Player) return;

    bool bGrounded = IsPlayerGrounded();

    if (!bWasGrounded && bGrounded)
    {
        float FallDist = FallStartZ - Player->GetActorLocation().Z;
        if (FallDist > FallDamageMinHeight)
        {
            float Damage = (FallDist - FallDamageMinHeight) * FallDamageMultiplier * 100.f;
            APhobiaPlayerCharacter* PHC = Cast<APhobiaPlayerCharacter>(Player);
            if (PHC) PHC->TakeDamage_Phobia(Damage);
        }
    }

    if (bGrounded && !bWasGrounded) {}
    if (!bGrounded && bWasGrounded) FallStartZ = Player->GetActorLocation().Z;

    bWasGrounded = bGrounded;
}

bool UAcrophobiaEffect::IsPlayerGrounded() const
{
    APawn* Player = UGameplayStatics::GetPlayerPawn(GetWorld(), 0);
    if (!Player) return true;
    ACharacter* Char = Cast<ACharacter>(Player);
    return Char && Char->GetCharacterMovement()->IsMovingOnGround();
}

void UAcrophobiaEffect::ApplyEffect(float InIntensity)
{
    // Vignette y chromatic aberration via Blueprint
}
