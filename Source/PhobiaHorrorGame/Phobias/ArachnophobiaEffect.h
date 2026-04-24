#pragma once
#include "CoreMinimal.h"
#include "PhobiaEffectComponent.h"
#include "ArachnophobiaEffect.generated.h"

class UNiagaraSystem;

UCLASS(ClassGroup=(Phobia), meta=(BlueprintSpawnableComponent))
class PHOBIAHORORGAME_API UArachnophobiaEffect : public UPhobiaEffectComponent
{
    GENERATED_BODY()

public:
    // ── Arañas decorativas en paredes ─────────────────────────────
    UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Arachnophobia")
    TSubclassOf<AActor> DecorativeSpiderClass;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Arachnophobia")
    int32 DecorativeSpiderCount = 10;

    // ── Jump Scare ────────────────────────────────────────────────
    UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Arachnophobia|JumpScare")
    TArray<UTexture2D*> JumpScareTextures;

    UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Arachnophobia|JumpScare")
    float JumpScareInterval = 90.f;

    // ── Luces parpadeantes ────────────────────────────────────────
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Arachnophobia|Lights")
    TArray<ULightComponent*> FlickeringLights;

    // ── Audio ─────────────────────────────────────────────────────
    UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Arachnophobia|Audio")
    TArray<USoundBase*> SkitterSounds;

    UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Arachnophobia|Audio")
    USoundBase* WebTearSound;

    // Delegado para que el HUD muestre el jump scare
    DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FOnJumpScare, UTexture2D*, Texture);
    UPROPERTY(BlueprintAssignable) FOnJumpScare OnJumpScare;

    virtual void ActivateEffect() override;

protected:
    virtual void TickComponent(float DeltaTime, ELevelTick TickType,
                               FActorComponentTickFunction* ThisTickFunction) override;
    virtual void ApplyEffect(float InIntensity) override;

private:
    float JumpScareTimer = 0.f;
    float FlickerTimer = 0.f;
    float SkitterSoundTimer = 0.f;

    void TriggerJumpScare();
    void UpdateFlickerLights(float DeltaTime);
    void SpawnDecorativeSpiders();
};
