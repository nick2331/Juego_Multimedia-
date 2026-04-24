#pragma once
#include "CoreMinimal.h"
#include "GameFramework/Actor.h"
#include "InteractableInterface.h"
#include "../Player/InventoryComponent.h"
#include "DoorActor.generated.h"

UCLASS()
class PHOBIAHORORGAME_API ADoorActor : public AActor, public IInteractableInterface
{
    GENERATED_BODY()

public:
    ADoorActor();

    UPROPERTY(VisibleAnywhere) UStaticMeshComponent* DoorMesh;
    UPROPERTY(VisibleAnywhere) UStaticMeshComponent* FrameMesh;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Door")
    bool bIsLocked = false;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Door")
    bool bRequiresKeyCard = false;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Door")
    float OpenAngle = 90.f;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Door")
    float OpenSpeed = 3.f;

    UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Door|Audio")
    USoundBase* OpenSound;

    UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Door|Audio")
    USoundBase* CloseSound;

    UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Door|Audio")
    USoundBase* LockedSound;

    virtual FText GetInteractionText_Implementation() const override;
    virtual void Interact_Implementation(AActor* Interactor) override;

protected:
    virtual void BeginPlay() override;
    virtual void Tick(float DeltaTime) override;

private:
    bool bIsOpen = false;
    bool bIsMoving = false;
    FRotator ClosedRotation;
    FRotator OpenRotation;
    FRotator TargetRotation;

    void ToggleDoor();
};
