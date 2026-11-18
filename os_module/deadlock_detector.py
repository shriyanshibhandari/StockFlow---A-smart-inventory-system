def find_deadlock_cycle(wait_for_graph):
    visited = set()
    current_path = []
    path_positions = {}

    def dfs(task):
        visited.add(task)
        path_positions[task] = len(current_path)
        current_path.append(task)

        for waiting_for in sorted(wait_for_graph.get(task, [])):

            if waiting_for not in visited:
                cycle = dfs(waiting_for)

                if cycle:
                    return cycle

            elif waiting_for in path_positions:
                start = path_positions[waiting_for]
                return current_path[start:]

        current_path.pop()
        path_positions.pop(task)

        return None

    all_tasks = set(wait_for_graph)

    for dependencies in wait_for_graph.values():
        all_tasks.update(dependencies)

    for task in sorted(all_tasks):
        if task not in visited:
            cycle = dfs(task)

            if cycle:
                return cycle

    return None


if __name__ == "__main__":

    wait_for_graph = {
    "Delivery_A": ["Delivery_B"],
    "Delivery_B": ["Delivery_C"],
    "Delivery_C": [],
    "Delivery_D": []
    }

    cycle = find_deadlock_cycle(wait_for_graph)

    if cycle:
        print("DEADLOCK DETECTED!")
        print("Deadlock cycle:", " -> ".join(cycle + [cycle[0]]))
    else:
        print("No deadlock detected.")
