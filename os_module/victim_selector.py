def select_victim(deadlock_cycle, task_details):
    """
    Select a task for recovery from the detected deadlock cycle.

    Lower priority value = lower priority.
    """

    if not deadlock_cycle:
        return None

    victim = None
    lowest_score = None

    for task in deadlock_cycle:
        details = task_details.get(task, {})

        priority = details.get("priority", 1)
        completed_work = details.get("completed_work", 0)
        recovery_cost = details.get("recovery_cost", 0)

        score = (priority * 3) + (completed_work * 2) + recovery_cost

        if lowest_score is None or score < lowest_score:
            lowest_score = score
            victim = task

    return victim


if __name__ == "__main__":

    deadlock_cycle = ["Task_A", "Task_B", "Task_C"]

    task_details = {
        "Task_A": {
            "priority": 3,
            "completed_work": 5,
            "recovery_cost": 4
        },
        "Task_B": {
            "priority": 1,
            "completed_work": 2,
            "recovery_cost": 1
        },
        "Task_C": {
            "priority": 2,
            "completed_work": 4,
            "recovery_cost": 3
        }
    }

    victim = select_victim(deadlock_cycle, task_details)

    print("Selected victim:", victim)