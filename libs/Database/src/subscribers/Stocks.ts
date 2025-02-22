import { EntitySubscriberInterface, EventSubscriber, InsertEvent } from "typeorm";
import { Stock } from "../entities/Stock";
import { SplitAction } from "../entities/SplitAction";

@EventSubscriber()
export class StockSubscriber implements EntitySubscriberInterface<Stock>
{
	listenTo() {
		return Stock;
	}

	async beforeInsert(event: InsertEvent<Stock>) {
		const splitAction = new SplitAction();
		splitAction.stock = event.entity;

		await event.manager.getRepository(SplitAction).save(splitAction);
	}
}