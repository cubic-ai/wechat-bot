
export function parseXml(xmlString: string): object {
    const parsedJson = {};

    if (xmlString) {
        xmlString = xmlString.trim();
        const tags = xmlString.match(/<[^>]+>/g);

        let previousTag: string = "";
        for (const tag of tags) {
            const tagName = tag.trim().replace(/[<>//]/g, "");
            // TODO: extract xml structure
            previousTag = tag;
        }
    }

    return parsedJson;
}
