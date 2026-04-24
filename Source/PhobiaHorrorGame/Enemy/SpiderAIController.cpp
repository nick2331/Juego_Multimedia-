#include "SpiderAIController.h"
#include "SpiderCharacter.h"
#include "BehaviorTree/BlackboardComponent.h"
#include "BehaviorTree/BehaviorTreeComponent.h"
#include "BehaviorTree/BehaviorTree.h"
#include "Perception/AIPerceptionComponent.h"
#include "Perception/AISenseConfig_Sight.h"
#include "Perception/AISenseConfig_Hearing.h"
#include "Perception/AIPerceptionStimuliSourceComponent.h"

// Definir claves del Blackboard
const FName ASpiderAIController::BB_PlayerActor   = FName("PlayerActor");
const FName ASpiderAIController::BB_TargetLocation = FName("TargetLocation");
const FName ASpiderAIController::BB_bPlayerVisible = FName("bPlayerVisible");
const FName ASpiderAIController::BB_bPlayerHeard   = FName("bPlayerHeard");
const FName ASpiderAIController::BB_EnemyState     = FName("EnemyState");
const FName ASpiderAIController::BB_PatrolIndex    = FName("PatrolIndex");

ASpiderAIController::ASpiderAIController()
{
    // ── Percepción: Vista ─────────────────────────────────────────
    SightConfig = CreateDefaultSubobject<UAISenseConfig_Sight>(TEXT("SightConfig"));
    SightConfig->SightRadius = 1800.f;
    SightConfig->LoseSightRadius = 2400.f;
    SightConfig->PeripheralVisionAngleDegrees = 80.f;
    SightConfig->SetMaxAge(5.f);
    SightConfig->DetectionByAffiliation.bDetectEnemies = true;
    SightConfig->DetectionByAffiliation.bDetectFriendlies = false;
    SightConfig->DetectionByAffiliation.bDetectNeutrals = false;

    // ── Percepción: Oído ──────────────────────────────────────────
    HearingConfig = CreateDefaultSubobject<UAISenseConfig_Hearing>(TEXT("HearingConfig"));
    HearingConfig->HearingRange = 1200.f;
    HearingConfig->SetMaxAge(3.f);
    HearingConfig->DetectionByAffiliation.bDetectEnemies = true;
    HearingConfig->DetectionByAffiliation.bDetectFriendlies = false;
    HearingConfig->DetectionByAffiliation.bDetectNeutrals = true;

    // ── AI Perception Component ───────────────────────────────────
    PerceptionComp = CreateDefaultSubobject<UAIPerceptionComponent>(TEXT("AIPerception"));
    PerceptionComp->ConfigureSense(*SightConfig);
    PerceptionComp->ConfigureSense(*HearingConfig);
    PerceptionComp->SetDominantSense(SightConfig->GetSenseImplementation());

    SetPerceptionComponent(*PerceptionComp);
}

void ASpiderAIController::BeginPlay()
{
    Super::BeginPlay();
    PerceptionComp->OnTargetPerceptionUpdated.AddDynamic(this, &ASpiderAIController::OnPerceptionUpdated);
}

void ASpiderAIController::OnPossess(APawn* InPawn)
{
    Super::OnPossess(InPawn);

    ASpiderCharacter* Spider = Cast<ASpiderCharacter>(InPawn);
    if (Spider && Spider->BehaviorTree)
    {
        RunBehaviorTree(Spider->BehaviorTree);
        // Inicializar Blackboard
        if (Blackboard)
        {
            Blackboard->SetValueAsInt(BB_PatrolIndex, 0);
            Blackboard->SetValueAsBool(BB_bPlayerVisible, false);
            Blackboard->SetValueAsBool(BB_bPlayerHeard, false);
        }
    }
}

void ASpiderAIController::OnPerceptionUpdated(const TArray<AActor*>& UpdatedActors)
{
    for (AActor* Actor : UpdatedActors)
    {
        if (!Actor) continue;

        FActorPerceptionBlueprintInfo Info;
        PerceptionComp->GetActorsPerception(Actor, Info);

        for (const FAIStimulus& Stimulus : Info.LastSensedStimuli)
        {
            if (Stimulus.Type == UAISense::GetSenseID<UAISense_Sight>())
                HandleSightPerception(Actor, Stimulus);
            else if (Stimulus.Type == UAISense::GetSenseID<UAISense_Hearing>())
                HandleHearingPerception(Actor, Stimulus);
        }
    }
}

void ASpiderAIController::HandleSightPerception(AActor* Actor, FAIStimulus Stimulus)
{
    if (!Blackboard) return;

    bool bSeen = Stimulus.WasSuccessfullySensed();
    Blackboard->SetValueAsBool(BB_bPlayerVisible, bSeen);

    if (bSeen)
    {
        Blackboard->SetValueAsObject(BB_PlayerActor, Actor);
        Blackboard->SetValueAsVector(BB_TargetLocation, Actor->GetActorLocation());

        ASpiderCharacter* Spider = Cast<ASpiderCharacter>(GetPawn());
        if (Spider) Spider->OnChaseStarted();
    }
}

void ASpiderAIController::HandleHearingPerception(AActor* Actor, FAIStimulus Stimulus)
{
    if (!Blackboard) return;

    if (Stimulus.WasSuccessfullySensed())
    {
        Blackboard->SetValueAsBool(BB_bPlayerHeard, true);
        Blackboard->SetValueAsVector(BB_TargetLocation, Stimulus.StimulusLocation);
    }
}
