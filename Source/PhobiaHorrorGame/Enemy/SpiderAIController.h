#pragma once
#include "CoreMinimal.h"
#include "AIController.h"
#include "Perception/AIPerceptionComponent.h"
#include "Perception/AISenseConfig_Sight.h"
#include "Perception/AISenseConfig_Hearing.h"
#include "SpiderAIController.generated.h"

class UBehaviorTreeComponent;
class UBlackboardComponent;

// ── Claves del Blackboard ────────────────────────────────────────
// Crea un Blackboard asset en UE5 con estas claves:
//   PlayerActor  (Object / Base Class: Actor)
//   TargetLocation (Vector)
//   bPlayerVisible (Bool)
//   bPlayerHeard   (Bool)
//   EnemyState     (Enum / EEnemyState)
//   PatrolIndex    (Int)

UCLASS()
class PHOBIAHORORGAME_API ASpiderAIController : public AAIController
{
    GENERATED_BODY()

public:
    ASpiderAIController();

    // Nombres de claves del Blackboard
    static const FName BB_PlayerActor;
    static const FName BB_TargetLocation;
    static const FName BB_bPlayerVisible;
    static const FName BB_bPlayerHeard;
    static const FName BB_EnemyState;
    static const FName BB_PatrolIndex;

protected:
    virtual void BeginPlay() override;
    virtual void OnPossess(APawn* InPawn) override;

    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "AI")
    UAIPerceptionComponent* PerceptionComp;

    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "AI")
    UAISenseConfig_Sight* SightConfig;

    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "AI")
    UAISenseConfig_Hearing* HearingConfig;

private:
    UFUNCTION()
    void OnPerceptionUpdated(const TArray<AActor*>& UpdatedActors);

    void HandleSightPerception(AActor* Actor, FAIStimulus Stimulus);
    void HandleHearingPerception(AActor* Actor, FAIStimulus Stimulus);
};
