#pragma once
#include "CoreMinimal.h"
#include "PhobiaEffectComponent.h"
#include "AcrophobiaEffect.generated.h"

UCLASS(ClassGroup=(Phobia), meta=(BlueprintSpawnableComponent))
class PHOBIAHORORGAME_API UAcrophobiaEffect : public UPhobiaEffectComponent
{
    GENERATED_BODY()

public:
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Acrophobia")
    float GroundLevel = 0.f;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Acrophobia")
    float MaxHeightEffect = 4000.f; // cm (= 40 metros)

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Acrophobia")
    float VertigoFOVReduction = 20.f;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Acrophobia")
    float CameraSwayAmount = 2.5f;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Acrophobia")
    float CameraSwaySpeed = 1.5f;

    // Daño por caída
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Acrophobia")
    float FallDamageMinHeight = 600.f; // cm = 6m

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Acrophobia")
    float FallDamageMultiplier = 0.015f;

    UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Acrophobia|Audio")
    USoundBase* WindSound;

    UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Acrophobia|Audio")
    USoundBase* VertigoSound;

    UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Acrophobia|Audio")
    USoundBase* HeartbeatSound;

    virtual void ActivateEffect() override;

protected:
    virtual void TickComponent(float DeltaTime, ELevelTick TickType,
                               FActorComponentTickFunction* ThisTickFunction) override;
    virtual void ApplyEffect(float InIntensity) override;

private:
    float SwayTimer = 0.f;
    float FallStartZ = 0.f;
    bool bWasGrounded = true;

    UAudioComponent* WindAudioComp = nullptr;

    float GetHeightRatio() const;
    bool IsPlayerGrounded() const;
    void UpdateCameraSway(float DeltaTime);
    void UpdateFOV(float DeltaTime);
    void UpdateWind();
    void CheckFallDamage();
};
