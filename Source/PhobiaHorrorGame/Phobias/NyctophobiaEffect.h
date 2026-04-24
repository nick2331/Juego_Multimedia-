#pragma once
#include "CoreMinimal.h"
#include "PhobiaEffectComponent.h"
#include "NyctophobiaEffect.generated.h"

UCLASS(ClassGroup=(Phobia), meta=(BlueprintSpawnableComponent))
class PHOBIAHORORGAME_API UNyctophobiaEffect : public UPhobiaEffectComponent
{
    GENERATED_BODY()

public:
    // Batería drena más rápido en nictofobia
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Nyctophobia")
    float BatteryDrainMultiplier = 2.8f;

    // Rango y ángulo de linterna reducidos
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Nyctophobia")
    float FlashlightRange = 1400.f;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Nyctophobia")
    float FlashlightAngle = 40.f;

    // Luz ambiente casi cero
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Nyctophobia")
    FLinearColor AmbientColor = FLinearColor(0.01f, 0.01f, 0.02f);

    // Niebla densa
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Nyctophobia")
    float FogDensity = 0.06f;

    // Sombras que se mueven cuando no las miras
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Nyctophobia")
    TArray<AActor*> ShadowActors;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Nyctophobia")
    float ShadowMoveRadius = 800.f;

    UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Nyctophobia|Audio")
    TArray<USoundBase*> DarknessSounds;

    UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Nyctophobia|Audio")
    USoundBase* WhisperSound;

    virtual void ActivateEffect() override;

protected:
    virtual void TickComponent(float DeltaTime, ELevelTick TickType,
                               FActorComponentTickFunction* ThisTickFunction) override;
    virtual void ApplyEffect(float InIntensity) override;

private:
    float DarkSoundTimer = 0.f;
    float ShadowMoveTimer = 0.f;

    void ConfigureFlashlight();
    void CheckPlayerInDark();
    void AnimateShadows();
    void PlayDarknessSound(float DeltaTime);
};
