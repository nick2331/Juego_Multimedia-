#pragma once
#include "CoreMinimal.h"
#include "GameFramework/Actor.h"
#include "ExitTriggerActor.generated.h"

class UBoxComponent;
class UNiagaraComponent;
class UNiagaraSystem;

UCLASS()
class PHOBIAHORORGAME_API AExitTriggerActor : public AActor
{
    GENERATED_BODY()

public:
    AExitTriggerActor();

    UPROPERTY(VisibleAnywhere) UBoxComponent* TriggerBox;
    UPROPERTY(VisibleAnywhere) UStaticMeshComponent* ExitMesh;
    UPROPERTY(VisibleAnywhere) UPointLightComponent* ExitLight;
    UPROPERTY(VisibleAnywhere) UNiagaraComponent* ExitParticles;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Exit")
    bool bRequireAllObjectives = true;

    UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Exit|Audio")
    USoundBase* ExitUnlockedSound;

    UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Exit|Audio")
    USoundBase* ExitLockedSound;

protected:
    virtual void BeginPlay() override;

private:
    bool bIsUnlocked = false;

    UFUNCTION()
    void OnTriggerEnter(UPrimitiveComponent* HitComp, AActor* OtherActor,
                        UPrimitiveComponent* OtherComp, int32 OtherBodyIndex,
                        bool bFromSweep, const FHitResult& SweepResult);

    void UnlockExit();
};
