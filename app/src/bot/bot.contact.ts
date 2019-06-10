import { List } from "immutable";
import { isNullOrUndefined } from "util";

export const requestContactList = async (baseUrl: string) => {
    const url: string = `${baseUrl}/cgi-bin/mmwebwx-bin/webwxgetcontact`;
    return [];
};

export const extractFriends = (contactList: any[]) => {
    //
};

export const extractChatGroups = (contactList: any[]) => {
    //
};

export const extractFriendsAndChatGroups = (contactList: any[]) => {
    let chatGroups = List();
    let friends = List();
    if (Array.isArray(contactList)) {
        contactList.forEach(contact => {
            if (!isNullOrUndefined(contact)) {
                if (typeof contact.UserName === "string") {
                    if (contact.UserName.startsWith("@@")) {
                        chatGroups = chatGroups.push(contact);
                    } else if (contact.UserName.startsWith("@")) {
                        if (!isNullOrUndefined(contact.Sex) && contact.Sex !== 0) {
                            friends = friends.push(contact);
                        }
                    }
                }
            }
        });
    }
    return { chatGroups, friends };
};
