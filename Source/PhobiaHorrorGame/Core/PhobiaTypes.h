#pragma once
#include "CoreMinimal.h"
#include "PhobiaTypes.generated.h"

UENUM(BlueprintType)
enum class EPhobiaLevel : uint8
{
    Arachnophobia   UMETA(DisplayName = "Aracnofobia (Arañas)"),
    Claustrophobia  UMETA(DisplayName = "Claustrofobia (Espacios Cerrados)"),
    Nyctophobia     UMETA(DisplayName = "Nictofobia (Oscuridad)"),
    Acrophobia      UMETA(DisplayName = "Acrofobia (Alturas)")
};

UENUM(BlueprintType)
enum class EGameMode : uint8
{
    Survival    UMETA(DisplayName = "Supervivencia"),
    Escape      UMETA(DisplayName = "Escapada"),
    Objectives  UMETA(DisplayName = "Objetivos")
};

UENUM(BlueprintType)
enum class EGamePhase : uint8
{
    MainMenu,
    Playing,
    Paused,
    PlayerDead,
    LevelComplete
};

USTRUCT(BlueprintType)
struct FPhobiaLevelConfig
{
    GENERATED_BODY()

    UPROPERTY(EditAnywhere, BlueprintReadWrite) FName LevelName;
    UPROPERTY(EditAnywhere, BlueprintReadWrite) EPhobiaLevel PhobiaType;
    UPROPERTY(EditAnywhere, BlueprintReadWrite) FString Description;
    UPROPERTY(EditAnywhere, BlueprintReadWrite) TSoftObjectPtr<UWorld> LevelAsset;
    UPROPERTY(EditAnywhere, BlueprintReadWrite) FLinearColor AccentColor = FLinearColor(1,0,0,1);
};
