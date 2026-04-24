#include "DoorActor.h"
#include "Components/StaticMeshComponent.h"
#include "Kismet/GameplayStatics.h"
#include "../Player/PhobiaPlayerCharacter.h"

ADoorActor::ADoorActor()
{
    PrimaryActorTick.bCanEverTick = true;

    FrameMesh = CreateDefaultSubobject<UStaticMeshComponent>(TEXT("Frame"));
    RootComponent = FrameMesh;

    DoorMesh = CreateDefaultSubobject<UStaticMeshComponent>(TEXT("Door"));
    DoorMesh->SetupAttachment(FrameMesh);
}

void ADoorActor::BeginPlay()
{
    Super::BeginPlay();
    ClosedRotation = DoorMesh->GetRelativeRotation();
    OpenRotation = ClosedRotation + FRotator(0.f, OpenAngle, 0.f);
    TargetRotation = ClosedRotation;
}

void ADoorActor::Tick(float DeltaTime)
{
    Super::Tick(DeltaTime);
    if (!bIsMoving) return;

    FRotator Current = DoorMesh->GetRelativeRotation();
    FRotator NewRot = FMath::RInterpTo(Current, TargetRotation, DeltaTime, OpenSpeed);
    DoorMesh->SetRelativeRotation(NewRot);

    if (NewRot.Equals(TargetRotation, 1.f))
    {
        DoorMesh->SetRelativeRotation(TargetRotation);
        bIsMoving = false;
    }
}

FText ADoorActor::GetInteractionText_Implementation() const
{
    if (bIsLocked) return FText::FromString("Bloqueada");
    return bIsOpen ? FText::FromString("Cerrar") : FText::FromString("Abrir");
}

void ADoorActor::Interact_Implementation(AActor* Interactor)
{
    if (bIsLocked)
    {
        APhobiaPlayerCharacter* Player = Cast<APhobiaPlayerCharacter>(Interactor);
        if (Player && Player->InventoryComp && bRequiresKeyCard)
        {
            if (Player->InventoryComp->RemoveItem(EItemType::KeyCard))
                bIsLocked = false;
            else
            {
                UGameplayStatics::PlaySoundAtLocation(this, LockedSound, GetActorLocation());
                return;
            }
        }
        else
        {
            UGameplayStatics::PlaySoundAtLocation(this, LockedSound, GetActorLocation());
            return;
        }
    }
    ToggleDoor();
}

void ADoorActor::ToggleDoor()
{
    bIsOpen = !bIsOpen;
    TargetRotation = bIsOpen ? OpenRotation : ClosedRotation;
    bIsMoving = true;
    USoundBase* Clip = bIsOpen ? OpenSound : CloseSound;
    if (Clip) UGameplayStatics::PlaySoundAtLocation(this, Clip, GetActorLocation());
}
