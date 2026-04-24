#pragma once
#include "CoreMinimal.h"
#include "UObject/Interface.h"
#include "InteractableInterface.generated.h"

UINTERFACE(MinimalAPI, BlueprintType)
class UInteractableInterface : public UInterface
{
    GENERATED_BODY()
};

class PHOBIAHORORGAME_API IInteractableInterface
{
    GENERATED_BODY()

public:
    // Texto mostrado al jugador ("Abrir puerta", "Recoger batería", etc.)
    UFUNCTION(BlueprintNativeEvent, BlueprintCallable, Category = "Interaction")
    FText GetInteractionText() const;

    // Ejecutar la interacción
    UFUNCTION(BlueprintNativeEvent, BlueprintCallable, Category = "Interaction")
    void Interact(AActor* Interactor);
};
