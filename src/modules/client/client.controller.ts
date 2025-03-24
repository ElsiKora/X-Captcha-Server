import { ApiController, EApiRouteType, IApiControllerBase, IApiControllerProperties } from "@elsikora/nestjs-crud-automator";

import ClientService from "./client.service";
import { Client } from "./entity/client.entity";

const config: IApiControllerProperties<Client> = {
	entity: Client,
	name: "Client",
	path: "client",
	routes: {
		[EApiRouteType.CREATE]: {
			isEnabled: true,
		},
	},
};

@ApiController<Client>(config)
export default class ClientController implements IApiControllerBase<Client> {
	constructor(public service: ClientService) {}
}
