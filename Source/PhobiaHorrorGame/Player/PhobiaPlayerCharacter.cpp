#include "PhobiaPlayerCharacter.h"
#include "Camera/CameraComponent.h"
#include "GameFramework/CharacterMovementComponent.h"
#include "EnhancedInputComponent.h"
#include "EnhancedInputSubsystems.h"
#include "SanityComponent.h"
#include "FlashlightComponent.h"
#include "InventoryComponent.h"
#include "../Interaction/InteractableInterface.h"
#include "../Core/PhobiaGameMode.h"
#include "Kismet/GameplayStatics.h"
#include "DrawDebugHelpers.h"
#include "Components/SpotLightComponent.h"

APhobiaPlayerCharacter::APhobiaPlayerCharacter()
{
    PrimaryActorTick.bCanEverTick = true;

    // Cámara FPS en primera persona
    FPSCamera = CreateDefaultSubobject<UCameraComponent>(TEXT("FPSCamera"));
    FPSCamera->SetupAttachment(GetMesh(), FName("head"));
    FPSCamera->bUsePawnControlRotation = true;

    // Componentes
    SanityComp = CreateDefaultSubobject<USanityComponent>(TEXT("SanityComp"));
    FlashlightComp = CreateDefaultSubobject<UFlashlightComponent>(TEXT("FlashlightComp"));
    InventoryComp = CreateDefaultSubobject<UInventoryComponent>(TEXT("InventoryComp"));

    // Ocultar malla del cuerpo en primera persona
    GetMesh()->SetOwnerNoSee(true);

    // No rotar con el movimiento, la cámara controla
    bUseControllerRotationYaw = true;
    GetCharacterMovement()->bOrientRotationToMovement = false;
}

void APhobiaPlayerCharacter::BeginPlay()
{
    Super::BeginPlay();

    CurrentHealth = MaxHealth;
    CurrentStamina = MaxStamina;

    // Registrar Input Mapping Context
    if (APlayerController* PC = Cast<APlayerController>(GetController()))
    {
        if (UEnhancedInputLocalPlayerSubsystem* Subsystem =
            ULocalPlayer::GetSubsystem<UEnhancedInputLocalPlayerSubsystem>(PC->GetLocalPlayer()))
        {
            Subsystem->AddMappingContext(DefaultMappingContext, 0);
        }
    }

    GetCharacterMovement()->MaxWalkSpeed = WalkSpeed;
}

void APhobiaPlayerCharacter::Tick(float DeltaTime)
{
    Super::Tick(DeltaTime);

    if (bIsDead) return;

    UpdateStamina(DeltaTime);
    UpdateHealthRegen(DeltaTime);
    CheckInteractable();

    // Sonidos de pasos
    if (GetVelocity().Size() > 50.f && GetCharacterMovement()->IsMovingOnGround())
    {
        float Interval = bIsSprinting ? FootstepInterval * 0.6f : FootstepInterval;
        FootstepTimer += DeltaTime;
        if (FootstepTimer >= Interval)
        {
            FootstepTimer = 0.f;
            PlayFootstep();
        }
    }
}

void APhobiaPlayerCharacter::SetupPlayerInputComponent(UInputComponent* PlayerInputComponent)
{
    if (UEnhancedInputComponent* EIC = Cast<UEnhancedInputComponent>(PlayerInputComponent))
    {
        EIC->BindAction(MoveAction,      ETriggerEvent::Triggered, this, &APhobiaPlayerCharacter::Move);
        EIC->BindAction(LookAction,      ETriggerEvent::Triggered, this, &APhobiaPlayerCharacter::Look);
        EIC->BindAction(JumpAction,      ETriggerEvent::Started,   this, &ACharacter::Jump);
        EIC->BindAction(JumpAction,      ETriggerEvent::Completed, this, &ACharacter::StopJumping);
        EIC->BindAction(SprintAction,    ETriggerEvent::Started,   this, &APhobiaPlayerCharacter::StartSprint);
        EIC->BindAction(SprintAction,    ETriggerEvent::Completed, this, &APhobiaPlayerCharacter::StopSprint);
        EIC->BindAction(CrouchAction,    ETriggerEvent::Started,   this, &APhobiaPlayerCharacter::ToggleCrouch);
        EIC->BindAction(InteractAction,  ETriggerEvent::Started,   this, &APhobiaPlayerCharacter::Interact);
        EIC->BindAction(FlashlightAction,ETriggerEvent::Started,   this, &UFlashlightComponent::Toggle, FlashlightComp);
        EIC->BindAction(UseItemAction,   ETriggerEvent::Started,   this, &APhobiaPlayerCharacter::UseItem);
    }
}

void APhobiaPlayerCharacter::Move(const FInputActionValue& Value)
{
    FVector2D MovVec = Value.Get<FVector2D>();
    if (GetController())
    {
        AddMovementInput(GetActorForwardVector(), MovVec.Y);
        AddMovementInput(GetActorRightVector(), MovVec.X);
    }
}

void APhobiaPlayerCharacter::Look(const FInputActionValue& Value)
{
    FVector2D LookVec = Value.Get<FVector2D>();
    AddControllerYawInput(LookVec.X * SensitivityMultiplier);
    AddControllerPitchInput(LookVec.Y * SensitivityMultiplier);
}

void APhobiaPlayerCharacter::StartSprint()
{
    if (CurrentStamina > 5.f)
    {
        bIsSprinting = true;
        GetCharacterMovement()->MaxWalkSpeed = SprintSpeed * SpeedMultiplier;
    }
}

void APhobiaPlayerCharacter::StopSprint()
{
    bIsSprinting = false;
    GetCharacterMovement()->MaxWalkSpeed = WalkSpeed * SpeedMultiplier;
}

void APhobiaPlayerCharacter::ToggleCrouch()
{
    if (bIsCrouched) UnCrouch();
    else Crouch();
}

void APhobiaPlayerCharacter::UpdateStamina(float DeltaTime)
{
    const float DrainRate = 25.f;
    const float RegenRate_S = 15.f;

    if (bIsSprinting && GetVelocity().Size() > 100.f)
    {
        CurrentStamina = FMath::Max(0.f, CurrentStamina - DrainRate * DeltaTime);
        if (CurrentStamina <= 0.f) StopSprint();
    }
    else
    {
        CurrentStamina = FMath::Min(MaxStamina, CurrentStamina + RegenRate_S * DeltaTime);
    }
}

void APhobiaPlayerCharacter::UpdateHealthRegen(float DeltaTime)
{
    if (CurrentHealth >= MaxHealth) return;
    RegenTimer += DeltaTime;
    if (RegenTimer >= RegenDelay)
    {
        CurrentHealth = FMath::Min(MaxHealth, CurrentHealth + RegenRate * DeltaTime);
        OnHealthChanged.Broadcast(GetHealthPercent());
    }
}

void APhobiaPlayerCharacter::CheckInteractable()
{
    FVector Start = FPSCamera->GetComponentLocation();
    FVector End = Start + FPSCamera->GetForwardVector() * InteractionRange;

    FHitResult Hit;
    FCollisionQueryParams Params;
    Params.AddIgnoredActor(this);

    if (GetWorld()->LineTraceSingleByChannel(Hit, Start, End, ECC_Visibility, Params))
    {
        if (Hit.GetActor() && Hit.GetActor()->Implements<UInteractableInterface>())
        {
            CurrentInteractable = Hit.GetActor();
            return;
        }
    }
    CurrentInteractable = nullptr;
}

void APhobiaPlayerCharacter::Interact()
{
    if (CurrentInteractable && CurrentInteractable->Implements<UInteractableInterface>())
        IInteractableInterface::Execute_Interact(CurrentInteractable, this);
}

void APhobiaPlayerCharacter::UseItem()
{
    if (InventoryComp) InventoryComp->UseFirstItem();
}

void APhobiaPlayerCharacter::TakeDamage_Phobia(float DamageAmount)
{
    if (bIsDead) return;
    RegenTimer = 0.f;
    CurrentHealth = FMath::Max(0.f, CurrentHealth - DamageAmount);
    OnHealthChanged.Broadcast(GetHealthPercent());

    if (HurtSound) UGameplayStatics::PlaySoundAtLocation(this, HurtSound, GetActorLocation());

    if (CurrentHealth <= 0.f) Die();
}

void APhobiaPlayerCharacter::Heal(float Amount)
{
    CurrentHealth = FMath::Min(MaxHealth, CurrentHealth + Amount);
    OnHealthChanged.Broadcast(GetHealthPercent());
}

void APhobiaPlayerCharacter::PlayFootstep()
{
    if (FootstepSounds.Num() == 0) return;
    int32 Idx = FMath::RandRange(0, FootstepSounds.Num() - 1);
    UGameplayStatics::PlaySoundAtLocation(this, FootstepSounds[Idx], GetActorLocation(), 0.6f);
}

void APhobiaPlayerCharacter::Die()
{
    bIsDead = true;
    if (DeathSound) UGameplayStatics::PlaySoundAtLocation(this, DeathSound, GetActorLocation());
    OnPlayerDeath.Broadcast();

    APhobiaGameMode* GM = Cast<APhobiaGameMode>(UGameplayStatics::GetGameMode(this));
    if (GM) GM->NotifyPlayerDied();
}
