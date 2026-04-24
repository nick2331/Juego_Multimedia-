#pragma once
#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "FlashlightComponent.generated.h"

class USpotLightComponent;

DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FOnBatteryChanged, float, BatteryPercent);
DECLARE_DYNAMIC_MULTICAST_DELEGATE(FOnFlashlightDied);

UCLASS(ClassGroup=(Custom), meta=(BlueprintSpawnableComponent))
class PHOBIAHORORGAME_API UFlashlightComponent : public UActorComponent
{
    GENERATED_BODY()

public:
    UFlashlightComponent();

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Flashlight")
    float MaxBattery = 100.f;

    UPROPERTY(BlueprintReadOnly, Category = "Flashlight")
    float CurrentBattery;

    UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Flashlight")
    float DrainRate = 3.f;

    UPROPERTY(BlueprintReadWrite, Category = "Flashlight")
    float DrainMultiplier = 1.f;

    UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Flashlight")
    float FlickerThreshold = 20.f;

    UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Flashlight")
    float NormalIntensity = 5000.f;

    UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Flashlight")
    float NormalRange = 2000.f;

    UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Flashlight")
    USoundBase* ToggleSound;

    UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Flashlight")
    USoundBase* DeadSound;

    UPROPERTY(BlueprintAssignable, Category = "Events")
    FOnBatteryChanged OnBatteryChanged;

    UPROPERTY(BlueprintAssignable, Category = "Events")
    FOnFlashlightDied OnFlashlightDied;

    UFUNCTION(BlueprintCallable, Category = "Flashlight")
    void Toggle();

    UFUNCTION(BlueprintCallable, Category = "Flashlight")
    void Recharge(float Amount);

    UFUNCTION(BlueprintPure, Category = "Flashlight")
    bool IsFlashlightOn() const { return bIsOn && CurrentBattery > 0.f; }

    UFUNCTION(BlueprintPure, Category = "Flashlight")
    float GetBatteryPercent() const { return CurrentBattery / MaxBattery; }

    // Referencia a la luz real (asignar en Blueprint)
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Flashlight")
    USpotLightComponent* SpotLight;

protected:
    virtual void BeginPlay() override;
    virtual void TickComponent(float DeltaTime, ELevelTick TickType,
                               FActorComponentTickFunction* ThisTickFunction) override;

private:
    bool bIsOn = true;
    bool bIsFlickering = false;
    float FlickerTimer = 0.f;

    void DrainBattery(float DeltaTime);
    void StartFlicker();
    void UpdateFlicker(float DeltaTime);
    void KillFlashlight();
};
