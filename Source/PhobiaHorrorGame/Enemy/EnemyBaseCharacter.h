#pragma once
#include "CoreMinimal.h"
#include "GameFramework/Character.h"
#include "Perception/AIPerceptionComponent.h"
#include "EnemyBaseCharacter.generated.h"

class UAIPerceptionComponent;
class UBehaviorTree;
class UAudioComponent;

UENUM(BlueprintType)
enum class EEnemyState : uint8
{
    Idle,
    Patrol,
    Alert,
    Chase,
    Attack,
    Stunned,
    Dead
};

DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FOnEnemyStateChanged, EEnemyState, NewState);

UCLASS(Abstract)
class PHOBIAHORORGAME_API AEnemyBaseCharacter : public ACharacter
{
    GENERATED_BODY()

public:
    AEnemyBaseCharacter();

    // ── Behavior Tree (asignar en Blueprint) ─────────────────────
    UPROPERTY(EditDefaultsOnly, BlueprintReadOnly, Category = "AI")
    UBehaviorTree* BehaviorTree;

    // ── Stats ─────────────────────────────────────────────────────
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Combat")
    float MaxHealth = 100.f;

    UPROPERTY(BlueprintReadOnly, Category = "Combat")
    float CurrentHealth;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Combat")
    float AttackDamage = 25.f;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Combat")
    float AttackRange = 160.f;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Combat")
    float AttackCooldown = 1.5f;

    // ── Velocidades ───────────────────────────────────────────────
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Movement")
    float PatrolSpeed = 250.f;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Movement")
    float ChaseSpeed = 550.f;

    // ── Estado ────────────────────────────────────────────────────
    UPROPERTY(BlueprintReadOnly, Category = "AI")
    EEnemyState CurrentState = EEnemyState::Patrol;

    UPROPERTY(BlueprintAssignable, Category = "Events")
    FOnEnemyStateChanged OnStateChanged;

    // ── Audio ─────────────────────────────────────────────────────
    UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Audio")
    TArray<USoundBase*> IdleSounds;

    UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Audio")
    USoundBase* AlertSound;

    UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Audio")
    USoundBase* AttackSound;

    UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Audio")
    USoundBase* DeathSound;

    // ── Funciones ─────────────────────────────────────────────────
    UFUNCTION(BlueprintCallable, Category = "Combat")
    virtual void TakeDamage_Enemy(float Damage);

    UFUNCTION(BlueprintCallable, Category = "AI")
    void SetEnemyState(EEnemyState NewState);

    UFUNCTION(BlueprintCallable, Category = "Combat")
    virtual void PerformAttack();

    UFUNCTION(BlueprintPure, Category = "AI")
    EEnemyState GetEnemyState() const { return CurrentState; }

    // Puntos de patrulla (asignar en Editor)
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "AI")
    TArray<AActor*> PatrolPoints;

protected:
    virtual void BeginPlay() override;
    virtual void Die();

    float AttackTimer = 0.f;
    float IdleSoundTimer = 0.f;
    UAudioComponent* AudioComp = nullptr;
};
