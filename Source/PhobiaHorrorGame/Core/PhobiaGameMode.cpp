#include "PhobiaGameMode.h"
#include "PhobiaGameInstance.h"
#include "Kismet/GameplayStatics.h"
#include "GameFramework/PlayerController.h"

APhobiaGameMode::APhobiaGameMode()
{
    PrimaryActorTick.bCanEverTick = true;
}

void APhobiaGameMode::BeginPlay()
{
    Super::BeginPlay();

    // Bloquear cursor en juego
    APlayerController* PC = UGameplayStatics::GetPlayerController(this, 0);
    if (PC)
    {
        PC->bShowMouseCursor = false;
        PC->SetInputMode(FInputModeGameOnly());
    }

    SetPhase(EGamePhase::Playing);
}

void APhobiaGameMode::Tick(float DeltaTime)
{
    Super::Tick(DeltaTime);

    if (CurrentPhase != EGamePhase::Playing) return;

    UPhobiaGameInstance* GI = Cast<UPhobiaGameInstance>(GetGameInstance());
    if (!GI) return;

    GI->TotalPlayTime += DeltaTime;

    if (GI->SelectedMode == EGameMode::Survival)
    {
        SurvivalTimeElapsed += DeltaTime;
        if (SurvivalTimeElapsed >= SurvivalDuration)
            NotifyLevelComplete();
    }
}

void APhobiaGameMode::NotifyPlayerDied()
{
    UPhobiaGameInstance* GI = Cast<UPhobiaGameInstance>(GetGameInstance());
    if (GI) GI->DeathCount++;

    SetPhase(EGamePhase::PlayerDead);
    OnPlayerDied.Broadcast();
}

void APhobiaGameMode::NotifyLevelComplete()
{
    UPhobiaGameInstance* GI = Cast<UPhobiaGameInstance>(GetGameInstance());
    if (GI) GI->CompletedLevels++;

    SetPhase(EGamePhase::LevelComplete);
    OnLevelCompleted.Broadcast();
}

void APhobiaGameMode::TogglePause()
{
    if (CurrentPhase == EGamePhase::Playing)
        SetPhase(EGamePhase::Paused);
    else if (CurrentPhase == EGamePhase::Paused)
        SetPhase(EGamePhase::Playing);
}

float APhobiaGameMode::GetSurvivalProgress() const
{
    return SurvivalDuration > 0.f ? SurvivalTimeElapsed / SurvivalDuration : 0.f;
}

void APhobiaGameMode::SetPhase(EGamePhase NewPhase)
{
    CurrentPhase = NewPhase;

    switch (NewPhase)
    {
    case EGamePhase::Playing:
        UGameplayStatics::SetGlobalTimeDilation(this, 1.f);
        break;
    case EGamePhase::Paused:
        UGameplayStatics::SetGlobalTimeDilation(this, 0.f);
        break;
    case EGamePhase::PlayerDead:
        UGameplayStatics::SetGlobalTimeDilation(this, 0.3f);
        break;
    default:
        UGameplayStatics::SetGlobalTimeDilation(this, 1.f);
        break;
    }

    OnPhaseChanged.Broadcast(NewPhase);
}
