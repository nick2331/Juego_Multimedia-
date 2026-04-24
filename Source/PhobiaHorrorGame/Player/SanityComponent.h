#pragma once
#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "SanityComponent.generated.h"

DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FOnSanityChanged, float, SanityPercent);
DECLARE_DYNAMIC_MULTICAST_DELEGATE(FOnSanityDepleted);

UCLASS(ClassGroup=(Custom), meta=(BlueprintSpawnableComponent))
class PHOBIAHORORGAME_API USanityComponent : public UActorComponent
{
    GENERATED_BODY()

public:
    USanityComponent();

    UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Sanity")
    float MaxSanity = 100.f;

    UPROPERTY(BlueprintReadOnly, Category = "Sanity")
    float CurrentSanity;

    UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Sanity")
    float SanityLossInDark = 2.f;

    UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Sanity")
    float SanityLossNearEnemy = 18.f;

    UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Sanity")
    float EnemyDetectionRadius = 1200.f;

    UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Sanity")
    float SanityRegenRate = 4.f;

    UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Sanity")
    float SanityRegenDelay = 5.f;

    UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Sanity")
    float LowSanityThreshold = 40.f;

    UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Sanity")
    TArray<USoundBase*> HallucinationSounds;

    UPROPERTY(BlueprintAssignable, Category = "Events")
    FOnSanityChanged OnSanityChanged;

    UPROPERTY(BlueprintAssignable, Category = "Events")
    FOnSanityDepleted OnSanityDepleted;

    UFUNCTION(BlueprintCallable, Category = "Sanity")
    void RestoreSanity(float Amount);

    UFUNCTION(BlueprintPure, Category = "Sanity")
    float GetSanityPercent() const { return CurrentSanity / MaxSanity; }

    UFUNCTION(BlueprintPure, Category = "Sanity")
    bool IsLowSanity() const { return CurrentSanity < LowSanityThreshold; }

protected:
    virtual void BeginPlay() override;
    virtual void TickComponent(float DeltaTime, ELevelTick TickType,
                               FActorComponentTickFunction* ThisTickFunction) override;

private:
    void LoseSanity(float Amount);
    bool IsPlayerInDark() const;
    bool IsEnemyNearby() const;
    void TryPlayHallucination();

    float RegenTimer = 0.f;
    float HallucinationTimer = 0.f;
    UAudioComponent* AudioComp = nullptr;
};
