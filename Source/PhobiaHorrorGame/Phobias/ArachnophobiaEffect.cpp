#include "ArachnophobiaEffect.h"
#include "Kismet/GameplayStatics.h"
#include "Engine/World.h"
#include "../Enemy/SpiderSpawnManager.h"

void UArachnophobiaEffect::ActivateEffect()
{
    Super::ActivateEffect();
    SpawnDecorativeSpiders();
    JumpScareTimer = JumpScareInterval * 0.3f;
}

void UArachnophobiaEffect::TickComponent(float DeltaTime, ELevelTick TickType,
                                          FActorComponentTickFunction* ThisTickFunction)
{
    Super::TickComponent(DeltaTime, TickType, ThisTickFunction);

    // Intensidad basada en arañas activas
    ASpiderSpawnManager* SpawnMgr = Cast<ASpiderSpawnManager>(
        UGameplayStatics::GetActorOfClass(GetWorld(), ASpiderSpawnManager::StaticClass()));
    if (SpawnMgr)
    {
        float TargetIntensity = FMath::Clamp((float)SpawnMgr->GetActiveSpiderCount() / 6.f, 0.f, 1.f);
        Intensity = FMath::FInterpTo(Intensity, TargetIntensity, DeltaTime, 0.5f);
    }

    JumpScareTimer += DeltaTime;
    if (JumpScareTimer >= JumpScareInterval)
    {
        JumpScareTimer = 0.f;
        TriggerJumpScare();
    }

    UpdateFlickerLights(DeltaTime);

    SkitterSoundTimer += DeltaTime;
    if (SkitterSoundTimer >= FMath::RandRange(8.f, 20.f) && SkitterSounds.Num() > 0)
    {
        SkitterSoundTimer = 0.f;
        USoundBase* S = SkitterSounds[FMath::RandRange(0, SkitterSounds.Num()-1)];
        UGameplayStatics::PlaySoundAtLocation(this, S,
            UGameplayStatics::GetPlayerPawn(GetWorld(),0)->GetActorLocation(),
            FMath::RandRange(0.2f, 0.5f));
    }
}

void UArachnophobiaEffect::ApplyEffect(float InIntensity)
{
    // Efectos visuales aplicados vía Blueprint en el PostProcess Volume
    // El Blueprint lee la propiedad Intensity de este componente
}

void UArachnophobiaEffect::TriggerJumpScare()
{
    if (JumpScareTextures.Num() == 0) return;
    UTexture2D* Tex = JumpScareTextures[FMath::RandRange(0, JumpScareTextures.Num()-1)];
    OnJumpScare.Broadcast(Tex);
}

void UArachnophobiaEffect::UpdateFlickerLights(float DeltaTime)
{
    FlickerTimer += DeltaTime;
    if (FlickerTimer >= 0.08f)
    {
        FlickerTimer = 0.f;
        for (ULightComponent* L : FlickeringLights)
        {
            if (L) L->SetIntensity(FMath::RandRange(0.3f, 2.5f) * 1000.f);
        }
    }
}

void UArachnophobiaEffect::SpawnDecorativeSpiders()
{
    if (!DecorativeSpiderClass) return;
    // Arañas decorativas en paredes — posiciones asignadas en Editor
}
