#pragma once
#include "CoreMinimal.h"
#include "EnemyBaseCharacter.h"
#include "SpiderCharacter.generated.h"

class UNiagaraSystem;
class UNiagaraComponent;

UCLASS()
class PHOBIAHORORGAME_API ASpiderCharacter : public AEnemyBaseCharacter
{
    GENERATED_BODY()

public:
    ASpiderCharacter();

    // ── Telaraña Proyectil ────────────────────────────────────────
    UPROPERTY(EditDefaultsOnly, BlueprintReadOnly, Category = "Spider|Web")
    TSubclassOf<AActor> WebProjectileClass;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Spider|Web")
    float WebAttackRange = 900.f;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Spider|Web")
    float WebCooldown = 5.f;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Spider|Web")
    float WebSlowDuration = 3.f;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Spider|Web")
    FName WebShootSocketName = FName("WebSocket");

    // ── Caída del Techo (Jump Scare) ──────────────────────────────
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Spider|JumpScare")
    bool bCanDropFromCeiling = true;

    // ── Efectos Niagara ───────────────────────────────────────────
    UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Spider|FX")
    UNiagaraSystem* WebTrailFX;

    UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Spider|FX")
    UNiagaraSystem* LandFX;

    // ── Audio ─────────────────────────────────────────────────────
    UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Spider|Audio")
    USoundBase* WebShootSound;

    UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Spider|Audio")
    USoundBase* HissSound;

    UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Spider|Audio")
    USoundBase* SkitterSound;

    // ── Funciones Públicas ────────────────────────────────────────
    UFUNCTION(BlueprintCallable, Category = "Spider")
    void ShootWeb();

    UFUNCTION(BlueprintCallable, Category = "Spider")
    void DropFromCeiling(FVector TargetLocation);

    UFUNCTION(BlueprintPure, Category = "Spider")
    bool CanShootWeb() const { return WebCooldownTimer >= WebCooldown; }

    // Llamado desde Behavior Tree via Blueprint
    UFUNCTION(BlueprintCallable, Category = "Spider")
    void OnChaseStarted();

    virtual void PerformAttack() override;

protected:
    virtual void BeginPlay() override;
    virtual void Tick(float DeltaTime) override;

private:
    float WebCooldownTimer = 0.f;
    bool bIsDropping = false;

    void UpdateTimers(float DeltaTime);
};
