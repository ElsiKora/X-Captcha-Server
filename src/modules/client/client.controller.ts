import { ApiController, EApiRouteType, IApiControllerBase, IApiControllerProperties } from "@elsikora/nestjs-crud-automator";

import ClientService from "./client.service";
import { Client } from "./entity/client.entity";

const config: IApiControllerProperties<Client> = {
	entity: Client,
	name: "Client",
	path: "client",
	routes: {
		[EApiRouteType.CREATE]: {
			isEnabled: false,
		},
		[EApiRouteType.DELETE]: {
			isEnabled: false,
		},
		[EApiRouteType.GET]: {
			isEnabled: false,
		},
		[EApiRouteType.GET_LIST]: {
			isEnabled: true,
		},
		[EApiRouteType.PARTIAL_UPDATE]: {
			isEnabled: false,
		},
		[EApiRouteType.UPDATE]: {
			isEnabled: false,
		},
	},
};

@ApiController<Client>(config)
export default class ClientController implements IApiControllerBase<Client> {
	constructor(public service: ClientService) {}
}
