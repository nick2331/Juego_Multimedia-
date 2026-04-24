#pragma once
#include "CoreMinimal.h"
#include "Engine/GameInstance.h"
#include "PhobiaTypes.h"
#include "PhobiaGameInstance.generated.h"

UCLASS()
class PHOBIAHORORGAME_API UPhobiaGameInstance : public UGameInstance
{
    GENERATED_BODY()

public:
    // Estado persistente entre niveles
    UPROPERTY(BlueprintReadWrite, Category = "Game State")
    EPhobiaLevel SelectedLevel = EPhobiaLevel::Arachnophobia;

    UPROPERTY(BlueprintReadWrite, Category = "Game State")
    EGameMode SelectedMode = EGameMode::Escape;

    UPROPERTY(BlueprintReadWrite, Category = "Game State")
    int32 DeathCount = 0;

    UPROPERTY(BlueprintReadWrite, Category = "Game State")
    int32 CompletedLevels = 0;

    UPROPERTY(BlueprintReadWrite, Category = "Game State")
    float TotalPlayTime = 0.f;

    // Configuración de niveles (asignar en el Editor)
    UPROPERTY(EditDefaultsOnly, BlueprintReadOnly, Category = "Levels")
    TArray<FPhobiaLevelConfig> LevelConfigs;

    UFUNCTION(BlueprintCallable, Category = "Game")
    void StartLevel(EPhobiaLevel Level, EGameMode Mode);

    UFUNCTION(BlueprintCallable, Category = "Game")
    void ReturnToMainMenu();

    UFUNCTION(BlueprintPure, Category = "Game")
    FPhobiaLevelConfig GetCurrentLevelConfig() const;

    virtual void Init() override;
};
