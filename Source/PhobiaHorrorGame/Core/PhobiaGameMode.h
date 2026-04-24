#pragma once
#include "CoreMinimal.h"
#include "GameFramework/GameModeBase.h"
#include "PhobiaTypes.h"
#include "PhobiaGameMode.generated.h"

DECLARE_DYNAMIC_MULTICAST_DELEGATE(FOnPlayerDied);
DECLARE_DYNAMIC_MULTICAST_DELEGATE(FOnLevelCompleted);
DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FOnPhaseChanged, EGamePhase, NewPhase);

UCLASS()
class PHOBIAHORORGAME_API APhobiaGameMode : public AGameModeBase
{
    GENERATED_BODY()

public:
    APhobiaGameMode();

    UPROPERTY(BlueprintAssignable, Category = "Events")
    FOnPlayerDied OnPlayerDied;

    UPROPERTY(BlueprintAssignable, Category = "Events")
    FOnLevelCompleted OnLevelCompleted;

    UPROPERTY(BlueprintAssignable, Category = "Events")
    FOnPhaseChanged OnPhaseChanged;

    // Modo Supervivencia
    UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Survival")
    float SurvivalDuration = 180.f;

    UPROPERTY(BlueprintReadOnly, Category = "Survival")
    float SurvivalTimeElapsed = 0.f;

    UFUNCTION(BlueprintCallable, Category = "Game")
    void NotifyPlayerDied();

    UFUNCTION(BlueprintCallable, Category = "Game")
    void NotifyLevelComplete();

    UFUNCTION(BlueprintCallable, Category = "Game")
    void TogglePause();

    UFUNCTION(BlueprintPure, Category = "Game")
    EGamePhase GetCurrentPhase() const { return CurrentPhase; }

    UFUNCTION(BlueprintPure, Category = "Game")
    float GetSurvivalProgress() const;

protected:
    virtual void BeginPlay() override;
    virtual void Tick(float DeltaTime) override;

private:
    EGamePhase CurrentPhase = EGamePhase::Playing;
    void SetPhase(EGamePhase NewPhase);
};
