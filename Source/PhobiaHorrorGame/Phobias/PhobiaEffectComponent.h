#pragma once
#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "PhobiaEffectComponent.generated.h"

// Clase base para todos los efectos de fobia.
// Cada nivel tiene un componente hijo concreto.
UCLASS(Abstract, ClassGroup=(Phobia))
class PHOBIAHORORGAME_API UPhobiaEffectComponent : public UActorComponent
{
    GENERATED_BODY()

public:
    UPhobiaEffectComponent();

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Phobia")
    float Intensity = 0.f;

    UFUNCTION(BlueprintCallable, Category = "Phobia")
    virtual void ActivateEffect();

    UFUNCTION(BlueprintCallable, Category = "Phobia")
    virtual void DeactivateEffect();

    UFUNCTION(BlueprintCallable, Category = "Phobia")
    virtual void SetIntensity(float NewIntensity);

protected:
    virtual void BeginPlay() override;
    virtual void TickComponent(float DeltaTime, ELevelTick TickType,
                               FActorComponentTickFunction* ThisTickFunction) override;

    virtual void ApplyEffect(float InIntensity) {}

    bool bIsActive = false;

    // Acceso rápido a post-process del nivel
    APostProcessVolume* GetPostProcessVolume() const;
};
