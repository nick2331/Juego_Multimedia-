#include "SpiderSpawnManager.h"
#include "SpiderCharacter.h"
#include "Kismet/GameplayStatics.h"

ASpiderSpawnManager::ASpiderSpawnManager()
{
    PrimaryActorTick.bCanEverTick = false;
}

void ASpiderSpawnManager::BeginPlay()
{
    Super::BeginPlay();

    for (int32 i = 0; i < InitialSpiders; i++)
        SpawnSpider();

    // Timer de spawn periódico
    GetWorldTimerManager().SetTimer(SpawnTimer, this, &ASpiderSpawnManager::SpawnSpider,
                                     SpawnInterval, true, SpawnInterval);

    // Timer de caída del techo (primer drop a la mitad del intervalo)
    GetWorldTimerManager().SetTimer(CeilingDropTimer, this, &ASpiderSpawnManager::TryCeilingDrop,
                                     CeilingDropInterval, true, CeilingDropInterval * 0.5f);
}

void ASpiderSpawnManager::SpawnSpider()
{
    CleanDeadSpiders();
    if (ActiveSpiders.Num() >= MaxSpiders || !SpiderClass || SpawnPoints.Num() == 0) return;

    AActor* SpawnPoint = GetFarthestSpawnFromPlayer();
    if (!SpawnPoint) return;

    FActorSpawnParameters Params;
    Params.SpawnCollisionHandlingOverride = ESpawnActorCollisionHandlingMethod::AdjustIfPossibleButAlwaysSpawn;

    ASpiderCharacter* Spider = GetWorld()->SpawnActor<ASpiderCharacter>(
        SpiderClass, SpawnPoint->GetActorLocation(), SpawnPoint->GetActorRotation(), Params);

    if (Spider) ActiveSpiders.Add(Spider);
}

void ASpiderSpawnManager::TryCeilingDrop()
{
    CleanDeadSpiders();
    if (!SpiderClass || CeilingDropPoints.Num() == 0) return;

    APawn* Player = UGameplayStatics::GetPlayerPawn(this, 0);
    if (!Player) return;

    AActor* DropPoint = GetNearestCeilingPointToPlayer();
    if (!DropPoint) return;

    FActorSpawnParameters Params;
    Params.SpawnCollisionHandlingOverride = ESpawnActorCollisionHandlingMethod::AlwaysSpawn;

    ASpiderCharacter* Spider = GetWorld()->SpawnActor<ASpiderCharacter>(
        SpiderClass,
        DropPoint->GetActorLocation() + FVector(0,0,300.f),
        FRotator::ZeroRotator, Params);

    if (Spider)
    {
        ActiveSpiders.Add(Spider);
        Spider->DropFromCeiling(Player->GetActorLocation());
    }
}

AActor* ASpiderSpawnManager::GetFarthestSpawnFromPlayer() const
{
    APawn* Player = UGameplayStatics::GetPlayerPawn(this, 0);
    if (!Player || SpawnPoints.Num() == 0) return SpawnPoints[0];

    AActor* Best = nullptr;
    float MaxDist = 0.f;
    for (AActor* SP : SpawnPoints)
    {
        if (!SP) continue;
        float D = FVector::Dist(SP->GetActorLocation(), Player->GetActorLocation());
        if (D > MaxDist) { MaxDist = D; Best = SP; }
    }
    return Best;
}

AActor* ASpiderSpawnManager::GetNearestCeilingPointToPlayer() const
{
    APawn* Player = UGameplayStatics::GetPlayerPawn(this, 0);
    if (!Player || CeilingDropPoints.Num() == 0) return nullptr;

    AActor* Best = nullptr;
    float MinDist = FLT_MAX;
    for (AActor* CP : CeilingDropPoints)
    {
        if (!CP) continue;
        FVector Flat1(CP->GetActorLocation().X, CP->GetActorLocation().Y, 0.f);
        FVector Flat2(Player->GetActorLocation().X, Player->GetActorLocation().Y, 0.f);
        float D = FVector::Dist(Flat1, Flat2);
        if (D < MinDist) { MinDist = D; Best = CP; }
    }
    return Best;
}

void ASpiderSpawnManager::CleanDeadSpiders()
{
    ActiveSpiders.RemoveAll([](ASpiderCharacter* S){ return !IsValid(S); });
}

int32 ASpiderSpawnManager::GetActiveSpiderCount() const
{
    return ActiveSpiders.Num();
}
