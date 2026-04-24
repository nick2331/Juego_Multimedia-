#include "ExitTriggerActor.h"
#include "Components/BoxComponent.h"
#include "Components/StaticMeshComponent.h"
#include "Components/PointLightComponent.h"
#include "NiagaraComponent.h"
#include "Kismet/GameplayStatics.h"
#include "../Core/PhobiaGameMode.h"

AExitTriggerActor::AExitTriggerActor()
{
    TriggerBox = CreateDefaultSubobject<UBoxComponent>(TEXT("TriggerBox"));
    TriggerBox->SetBoxExtent(FVector(120.f, 120.f, 200.f));
    RootComponent = TriggerBox;

    ExitMesh = CreateDefaultSubobject<UStaticMeshComponent>(TEXT("ExitMesh"));
    ExitMesh->SetupAttachment(RootComponent);

    ExitLight = CreateDefaultSubobject<UPointLightComponent>(TEXT("ExitLight"));
    ExitLight->SetupAttachment(RootComponent);
    ExitLight->SetIntensity(3000.f);
    ExitLight->SetLightColor(FLinearColor::Red);

    ExitParticles = CreateDefaultSubobject<UNiagaraComponent>(TEXT("ExitParticles"));
    ExitParticles->SetupAttachment(RootComponent);
    ExitParticles->SetAutoActivate(false);
}

void AExitTriggerActor::BeginPlay()
{
    Super::BeginPlay();
    TriggerBox->OnComponentBeginOverlap.AddDynamic(this, &AExitTriggerActor::OnTriggerEnter);

    if (!bRequireAllObjectives)
        UnlockExit();
}

void AExitTriggerActor::UnlockExit()
{
    bIsUnlocked = true;
    ExitLight->SetLightColor(FLinearColor::Green);
    ExitParticles->Activate();
    if (ExitUnlockedSound)
        UGameplayStatics::PlaySoundAtLocation(this, ExitUnlockedSound, GetActorLocation());
}

void AExitTriggerActor::OnTriggerEnter(UPrimitiveComponent* HitComp, AActor* OtherActor,
                                        UPrimitiveComponent* OtherComp, int32 OtherBodyIndex,
                                        bool bFromSweep, const FHitResult& SweepResult)
{
    if (!OtherActor || !OtherActor->ActorHasTag(FName("Player"))) return;

    if (bIsUnlocked)
    {
        APhobiaGameMode* GM = Cast<APhobiaGameMode>(UGameplayStatics::GetGameMode(this));
        if (GM) GM->NotifyLevelComplete();
    }
    else
    {
        if (ExitLockedSound)
            UGameplayStatics::PlaySoundAtLocation(this, ExitLockedSound, GetActorLocation());
    }
}
