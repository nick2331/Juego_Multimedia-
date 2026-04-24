#include "ItemPickupActor.h"
#include "Components/PointLightComponent.h"
#include "Components/StaticMeshComponent.h"
#include "GameFramework/RotatingMovementComponent.h"
#include "NiagaraFunctionLibrary.h"
#include "Kismet/GameplayStatics.h"
#include "../Player/PhobiaPlayerCharacter.h"

AItemPickupActor::AItemPickupActor()
{
    PrimaryActorTick.bCanEverTick = true;

    MeshComp = CreateDefaultSubobject<UStaticMeshComponent>(TEXT("Mesh"));
    RootComponent = MeshComp;
    MeshComp->SetCollisionProfileName(TEXT("OverlapAllDynamic"));

    GlowLight = CreateDefaultSubobject<UPointLightComponent>(TEXT("GlowLight"));
    GlowLight->SetupAttachment(RootComponent);
    GlowLight->SetIntensity(500.f);
    GlowLight->SetAttenuationRadius(200.f);

    RotatingComp = CreateDefaultSubobject<URotatingMovementComponent>(TEXT("RotatingComp"));
    RotatingComp->RotationRate = FRotator(0.f, 60.f, 0.f);
}

void AItemPickupActor::BeginPlay()
{
    Super::BeginPlay();
    StartLocation = GetActorLocation();

    // Color del brillo según tipo de ítem
    FLinearColor GlowColor;
    switch (ItemData.Type)
    {
    case EItemType::Battery:    GlowColor = FLinearColor::Yellow; break;
    case EItemType::MedKit:     GlowColor = FLinearColor::Red;    break;
    case EItemType::Sedative:   GlowColor = FLinearColor::Blue;   break;
    case EItemType::KeyCard:    GlowColor = FLinearColor::Green;  break;
    default:                    GlowColor = FLinearColor::White;  break;
    }
    GlowLight->SetLightColor(GlowColor);
}

void AItemPickupActor::Tick(float DeltaTime)
{
    Super::Tick(DeltaTime);
    BobTimer += DeltaTime * BobSpeed;
    FVector NewLoc = StartLocation + FVector(0.f, 0.f, FMath::Sin(BobTimer) * BobAmount);
    SetActorLocation(NewLoc);
}

FText AItemPickupActor::GetInteractionText_Implementation() const
{
    return FText::Format(FText::FromString("Recoger {0}"), FText::FromName(ItemData.ItemName));
}

void AItemPickupActor::Interact_Implementation(AActor* Interactor)
{
    APhobiaPlayerCharacter* Player = Cast<APhobiaPlayerCharacter>(Interactor);
    if (!Player || !Player->InventoryComp) return;

    if (Player->InventoryComp->TryPickup(ItemData))
    {
        if (PickupFX)
            UNiagaraFunctionLibrary::SpawnSystemAtLocation(GetWorld(), PickupFX, GetActorLocation());
        if (PickupSound)
            UGameplayStatics::PlaySoundAtLocation(this, PickupSound, GetActorLocation());
        Destroy();
    }
}
