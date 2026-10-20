import cluster from "node:cluster";

import ClusterPrimary from "./cluster/cluster-primary";
import CONFIG_CONSTANT from "./shared/constant/config.constant";

// Swagger generation runs once at build time and must not fork workers.
const isClusterEnabled: boolean = CONFIG_CONSTANT.CLUSTER_WORKER_COUNT > 1 && process.env.NODE_ENV !== "generate-swagger";

if (isClusterEnabled && cluster.isPrimary) {
	new ClusterPrimary(CONFIG_CONSTANT.CLUSTER_WORKER_COUNT, CONFIG_CONSTANT.CLUSTER_FORK_STAGGER_MS).start();
} else {
	// Loaded lazily so the primary never instantiates the Nest application, its database pool or its AWS clients.
	void import("./bootstrap").then(({ startApplication }) => {
		startApplication();
	});
}
