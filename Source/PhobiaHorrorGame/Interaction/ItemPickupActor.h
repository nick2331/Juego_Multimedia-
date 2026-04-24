#pragma once
#include "CoreMinimal.h"
#include "GameFramework/Actor.h"
#include "InteractableInterface.h"
#include "../Player/InventoryComponent.h"
#include "ItemPickupActor.generated.h"

class UNiagaraSystem;
class URotatingMovementComponent;

UCLASS()
class PHOBIAHORORGAME_API AItemPickupActor : public AActor, public IInteractableInterface
{
    GENERATED_BODY()

public:
    AItemPickupActor();

    UPROPERTY(VisibleAnywhere) UStaticMeshComponent* MeshComp;
    UPROPERTY(VisibleAnywhere) UPointLightComponent* GlowLight;
    UPROPERTY(VisibleAnywhere) URotatingMovementComponent* RotatingComp;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Item")
    FInventoryItem ItemData;

    UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Item")
    UNiagaraSystem* PickupFX;

    UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Item")
    USoundBase* PickupSound;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Item")
    float BobSpeed = 2.f;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Item")
    float BobAmount = 20.f;

    virtual FText GetInteractionText_Implementation() const override;
    virtual void Interact_Implementation(AActor* Interactor) override;

protected:
    virtual void BeginPlay() override;
    virtual void Tick(float DeltaTime) override;

private:
    FVector StartLocation;
    float BobTimer = 0.f;
};
