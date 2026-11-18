from os_module.resource_manager import log_event


def recover_deadlock(victim, deadlock_manager):

    if victim is None:
        return False

    log_event(
        "Deadlock recovery started",
        f"Recovering resources held by victim task: {victim}",
        "warning"
    )

    # Remove all dependencies involving the victim.
    for task in list(deadlock_manager.wait_for_graph.keys()):

        if task == victim:
            deadlock_manager.wait_for_graph[task] = []

        else:
            deadlock_manager.remove_dependency(task, victim)

    log_event(
        "Deadlock recovery completed",
        f"Dependencies released for victim task: {victim}",
        "success"
    )

    return True