#pragma once
#include "CoreMinimal.h"
#include "GameFramework/Character.h"
#include "InputActionValue.h"
#include "PhobiaPlayerCharacter.generated.h"

class UCameraComponent;
class USpringArmComponent;
class USpotLightComponent;
class USanityComponent;
class UFlashlightComponent;
class UInventoryComponent;
class UInputMappingContext;
class UInputAction;
class UPhobiaEffectComponent;

DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FOnHealthChanged, float, HealthPercent);
DECLARE_DYNAMIC_MULTICAST_DELEGATE(FOnPlayerDeath);

UCLASS()
class PHOBIAHORORGAME_API APhobiaPlayerCharacter : public ACharacter
{
    GENERATED_BODY()

public:
    APhobiaPlayerCharacter();

    // ── Componentes ──────────────────────────────────────────────
    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Camera")
    UCameraComponent* FPSCamera;

    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Components")
    USanityComponent* SanityComp;

    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Components")
    UFlashlightComponent* FlashlightComp;

    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Components")
    UInventoryComponent* InventoryComp;

    // ── Vida ──────────────────────────────────────────────────────
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Health")
    float MaxHealth = 100.f;

    UPROPERTY(BlueprintReadOnly, Category = "Health")
    float CurrentHealth;

    UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Health")
    float RegenDelay = 8.f;

    UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Health")
    float RegenRate = 5.f;

    // ── Movimiento ────────────────────────────────────────────────
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Movement")
    float WalkSpeed = 350.f;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Movement")
    float SprintSpeed = 620.f;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Movement")
    float CrouchSpeed = 180.f;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Movement")
    float MaxStamina = 100.f;

    UPROPERTY(BlueprintReadOnly, Category = "Movement")
    float CurrentStamina;

    // ── Input ─────────────────────────────────────────────────────
    UPROPERTY(EditDefaultsOnly, Category = "Input")
    UInputMappingContext* DefaultMappingContext;

    UPROPERTY(EditDefaultsOnly, Category = "Input")
    UInputAction* MoveAction;

    UPROPERTY(EditDefaultsOnly, Category = "Input")
    UInputAction* LookAction;

    UPROPERTY(EditDefaultsOnly, Category = "Input")
    UInputAction* JumpAction;

    UPROPERTY(EditDefaultsOnly, Category = "Input")
    UInputAction* SprintAction;

    UPROPERTY(EditDefaultsOnly, Category = "Input")
    UInputAction* CrouchAction;

    UPROPERTY(EditDefaultsOnly, Category = "Input")
    UInputAction* InteractAction;

    UPROPERTY(EditDefaultsOnly, Category = "Input")
    UInputAction* FlashlightAction;

    UPROPERTY(EditDefaultsOnly, Category = "Input")
    UInputAction* UseItemAction;

    // ── Interacción ───────────────────────────────────────────────
    UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Interaction")
    float InteractionRange = 300.f;

    // ── Sonidos ───────────────────────────────────────────────────
    UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Audio")
    TArray<USoundBase*> FootstepSounds;

    UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Audio")
    USoundBase* HurtSound;

    UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Audio")
    USoundBase* DeathSound;

    // ── Delegados ─────────────────────────────────────────────────
    UPROPERTY(BlueprintAssignable, Category = "Events")
    FOnHealthChanged OnHealthChanged;

    UPROPERTY(BlueprintAssignable, Category = "Events")
    FOnPlayerDeath OnPlayerDeath;

    // ── Funciones Públicas ────────────────────────────────────────
    UFUNCTION(BlueprintCallable, Category = "Health")
    void TakeDamage_Phobia(float DamageAmount);

    UFUNCTION(BlueprintCallable, Category = "Health")
    void Heal(float Amount);

    UFUNCTION(BlueprintPure, Category = "Health")
    float GetHealthPercent() const { return CurrentHealth / MaxHealth; }

    UFUNCTION(BlueprintPure, Category = "Movement")
    float GetStaminaPercent() const { return CurrentStamina / MaxStamina; }

    UFUNCTION(BlueprintPure, Category = "Movement")
    bool IsSprinting() const { return bIsSprinting; }

    // Modificadores externos (efectos de fobia)
    UPROPERTY(BlueprintReadWrite, Category = "Phobia")
    float SpeedMultiplier = 1.f;

    UPROPERTY(BlueprintReadWrite, Category = "Phobia")
    float SensitivityMultiplier = 1.f;

protected:
    virtual void BeginPlay() override;
    virtual void Tick(float DeltaTime) override;
    virtual void SetupPlayerInputComponent(class UInputComponent* PlayerInputComponent) override;

private:
    void Move(const FInputActionValue& Value);
    void Look(const FInputActionValue& Value);
    void StartSprint();
    void StopSprint();
    void ToggleCrouch();
    void Interact();
    void UseItem();

    void UpdateStamina(float DeltaTime);
    void UpdateHealthRegen(float DeltaTime);
    void PlayFootstep();
    void Die();
    void CheckInteractable();

    bool bIsSprinting = false;
    bool bIsDead = false;
    float RegenTimer = 0.f;
    float FootstepTimer = 0.f;
    float FootstepInterval = 0.5f;

    AActor* CurrentInteractable = nullptr;
};
