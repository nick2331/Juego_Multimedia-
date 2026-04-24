#include "InventoryComponent.h"
#include "PhobiaPlayerCharacter.h"
#include "FlashlightComponent.h"
#include "SanityComponent.h"

UInventoryComponent::UInventoryComponent()
{
    PrimaryComponentTick.bCanEverTick = false;
}

bool UInventoryComponent::TryPickup(FInventoryItem Item)
{
    if (Items.Num() >= MaxSlots) return false;
    Items.Add(Item);
    OnItemPickedUp.Broadcast(Item);
    return true;
}

void UInventoryComponent::UseFirstItem()
{
    for (int32 i = 0; i < Items.Num(); i++)
    {
        EItemType T = Items[i].Type;
        if (T == EItemType::Battery || T == EItemType::MedKit || T == EItemType::Sedative)
        {
            FInventoryItem Used = Items[i];
            Items.RemoveAt(i);
            ApplyItem(Used);
            OnItemUsed.Broadcast(Used);
            return;
        }
    }
}

void UInventoryComponent::ApplyItem(const FInventoryItem& Item)
{
    APhobiaPlayerCharacter* Player = Cast<APhobiaPlayerCharacter>(GetOwner());
    if (!Player) return;

    switch (Item.Type)
    {
    case EItemType::Battery:
        if (Player->FlashlightComp) Player->FlashlightComp->Recharge(Item.Value);
        break;
    case EItemType::MedKit:
        Player->Heal(Item.Value);
        break;
    case EItemType::Sedative:
        if (Player->SanityComp) Player->SanityComp->RestoreSanity(Item.Value);
        break;
    default: break;
    }
}

bool UInventoryComponent::HasItem(EItemType Type) const
{
    return Items.ContainsByPredicate([Type](const FInventoryItem& I){ return I.Type == Type; });
}

bool UInventoryComponent::RemoveItem(EItemType Type)
{
    for (int32 i = 0; i < Items.Num(); i++)
    {
        if (Items[i].Type == Type) { Items.RemoveAt(i); return true; }
    }
    return false;
}
