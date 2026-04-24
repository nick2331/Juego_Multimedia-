#include "PhobiaGameInstance.h"
#include "Kismet/GameplayStatics.h"

void UPhobiaGameInstance::Init()
{
    Super::Init();
}

void UPhobiaGameInstance::StartLevel(EPhobiaLevel Level, EGameMode Mode)
{
    SelectedLevel = Level;
    SelectedMode = Mode;

    FPhobiaLevelConfig Config = GetCurrentLevelConfig();
    if (!Config.LevelAsset.IsNull())
    {
        UGameplayStatics::OpenLevelBySoftObjectPtr(this, Config.LevelAsset);
    }
}

void UPhobiaGameInstance::ReturnToMainMenu()
{
    UGameplayStatics::OpenLevel(this, FName("MainMenu"));
}

FPhobiaLevelConfig UPhobiaGameInstance::GetCurrentLevelConfig() const
{
    for (const FPhobiaLevelConfig& Config : LevelConfigs)
    {
        if (Config.PhobiaType == SelectedLevel)
            return Config;
    }
    return FPhobiaLevelConfig();
}
