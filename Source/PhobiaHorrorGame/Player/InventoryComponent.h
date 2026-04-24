#pragma once
#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "InventoryComponent.generated.h"

UENUM(BlueprintType)
enum class EItemType : uint8
{
    Battery,    // Recarga linterna
    MedKit,     // Restaura vida
    Sedative,   // Restaura cordura
    Objective,  // Item de misión
    KeyCard     // Abre puertas
};

USTRUCT(BlueprintType)
struct FInventoryItem
{
    GENERATED_BODY()

    UPROPERTY(EditAnywhere, BlueprintReadWrite) FName ItemName;
    UPROPERTY(EditAnywhere, BlueprintReadWrite) EItemType Type;
    UPROPERTY(EditAnywhere, BlueprintReadWrite) float Value = 50.f;
    UPROPERTY(EditAnywhere, BlueprintReadWrite) UTexture2D* Icon = nullptr;
};

DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FOnItemPickedUp, FInventoryItem, Item);
DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FOnItemUsed, FInventoryItem, Item);

UCLASS(ClassGroup=(Custom), meta=(BlueprintSpawnableComponent))
class PHOBIAHORORGAME_API UInventoryComponent : public UActorComponent
{
    GENERATED_BODY()

public:
    UInventoryComponent();

    UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Inventory")
    int32 MaxSlots = 4;

    UPROPERTY(BlueprintReadOnly, Category = "Inventory")
    TArray<FInventoryItem> Items;

    UPROPERTY(BlueprintAssignable) FOnItemPickedUp OnItemPickedUp;
    UPROPERTY(BlueprintAssignable) FOnItemUsed OnItemUsed;

    UFUNCTION(BlueprintCallable, Category = "Inventory")
    bool TryPickup(FInventoryItem Item);

    UFUNCTION(BlueprintCallable, Category = "Inventory")
    void UseFirstItem();

    UFUNCTION(BlueprintCallable, Category = "Inventory")
    bool HasItem(EItemType Type) const;

    UFUNCTION(BlueprintCallable, Category = "Inventory")
    bool RemoveItem(EItemType Type);

private:
    void ApplyItem(const FInventoryItem& Item);
};
