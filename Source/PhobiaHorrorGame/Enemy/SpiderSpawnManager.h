#pragma once
#include "CoreMinimal.h"
#include "GameFramework/Actor.h"
#include "SpiderSpawnManager.generated.h"

class ASpiderCharacter;

UCLASS()
class PHOBIAHORORGAME_API ASpiderSpawnManager : public AActor
{
    GENERATED_BODY()

public:
    ASpiderSpawnManager();

    UPROPERTY(EditDefaultsOnly, BlueprintReadOnly, Category = "Spider")
    TSubclassOf<ASpiderCharacter> SpiderClass;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Spawning")
    TArray<AActor*> SpawnPoints;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Spawning")
    TArray<AActor*> CeilingDropPoints;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Spawning")
    int32 InitialSpiders = 2;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Spawning")
    int32 MaxSpiders = 6;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Spawning")
    float SpawnInterval = 45.f;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Spawning")
    float CeilingDropInterval = 30.f;

    UFUNCTION(BlueprintPure, Category = "Spider")
    int32 GetActiveSpiderCount() const;

protected:
    virtual void BeginPlay() override;

private:
    TArray<ASpiderCharacter*> ActiveSpiders;
    FTimerHandle SpawnTimer;
    FTimerHandle CeilingDropTimer;

    void SpawnSpider();
    void TryCeilingDrop();
    void CleanDeadSpiders();

    AActor* GetFarthestSpawnFromPlayer() const;
    AActor* GetNearestCeilingPointToPlayer() const;
};
