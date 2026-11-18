from os_module.deadlock_detector import find_deadlock_cycle
from os_module.victim_selector import select_victim
from os_module.deadlock_recovery import recover_deadlock
from os_module.resource_manager import log_event


class DeadlockManager:

    def __init__(self):
        self.wait_for_graph = {}

    def add_task(self, task):
        if task not in self.wait_for_graph:
            self.wait_for_graph[task] = []

    def add_dependency(self, waiting_task, holding_task):
        self.add_task(waiting_task)
        self.add_task(holding_task)

        if holding_task not in self.wait_for_graph[waiting_task]:
            self.wait_for_graph[waiting_task].append(holding_task)

        log_event(
            "Resource dependency added",
            f"{waiting_task} is waiting for {holding_task}",
            "warning"
        )

    def remove_dependency(self, waiting_task, holding_task):
        if waiting_task in self.wait_for_graph:
            if holding_task in self.wait_for_graph[waiting_task]:
                self.wait_for_graph[waiting_task].remove(holding_task)

    def detect_deadlock(self):
        return find_deadlock_cycle(self.wait_for_graph)

    def handle_deadlock(self, task_details):

        cycle = self.detect_deadlock()

        if not cycle:
            log_event(
                "Deadlock check completed",
                "No deadlock detected",
                "success"
            )
            return None

        log_event(
            "Deadlock detected",
            f"Deadlock cycle: {' -> '.join(cycle + [cycle[0]])}",
            "error"
        )

        victim = select_victim(cycle, task_details)

        log_event(
            "Victim selected",
            f"Task {victim} selected for recovery",
            "warning"
        )

        recover_deadlock(victim, self)

        return victim

    def get_wait_for_graph(self):
        return self.wait_for_graph