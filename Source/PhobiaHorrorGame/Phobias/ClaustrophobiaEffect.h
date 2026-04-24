#pragma once
#include "CoreMinimal.h"
#include "PhobiaEffectComponent.h"
#include "ClaustrophobiaEffect.generated.h"

UCLASS(ClassGroup=(Phobia), meta=(BlueprintSpawnableComponent))
class PHOBIAHORORGAME_API UClaustrophobiaEffect : public UPhobiaEffectComponent
{
    GENERATED_BODY()

public:
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Claustrophobia")
    float OpenSpaceCheckRadius = 400.f;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Claustrophobia")
    float NormalFOV = 90.f;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Claustrophobia")
    float MinFOV = 60.f;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Claustrophobia")
    float TightSpeedMultiplier = 0.55f;

    UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Claustrophobia|Audio")
    USoundBase* HeartbeatSlowSound;

    UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Claustrophobia|Audio")
    USoundBase* HeartbeatFastSound;

    UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Claustrophobia|Audio")
    USoundBase* WallCreakSound;

    UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Claustrophobia|Audio")
    USoundBase* BreathingSound;

protected:
    virtual void TickComponent(float DeltaTime, ELevelTick TickType,
                               FActorComponentTickFunction* ThisTickFunction) override;
    virtual void ApplyEffect(float InIntensity) override;

private:
    float MeasureTightness() const;
    void UpdateFOV(float DeltaTime);
    void UpdateHeartbeat();
    void UpdatePlayerSpeed();

    UAudioComponent* HeartbeatAudio = nullptr;
    float WallCreakTimer = 0.f;
    float LastIntensity = 0.f;
};
