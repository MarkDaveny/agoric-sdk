/**
 * MakeCLists Module
 * This module is instantiated per CommsVat and stores data about
 * mappings between external machines and slots.
 *
 * a clist maps a local machine kernel slot to what will be sent over the wire
 *
 * @module makeCLists
 */

export function makeCLists() {
  const state = new Map();

  function checkIfAlreadyExists(incomingWireMessageObj, kernelToMeSlot) {
    const slot = state.get(JSON.stringify(incomingWireMessageObj));
    const outgoing = state.get(JSON.stringify(kernelToMeSlot));
    if (slot || outgoing) {
      throw new Error(
        `${JSON.stringify(kernelToMeSlot)} already exists in clist`,
      );
    }
  }

  const changePerspectiveMap = new Map();
  // youToMe: your-egress, meToYou: your-ingress
  // youToMe: your-ingress, meToYou: your-egress
  // youToMe: your-promise, meToYou: your-resolver
  // youToMe: your-resolver, meToYou: your-promise
  changePerspectiveMap.set('your-egress', 'your-ingress');
  changePerspectiveMap.set('your-ingress', 'your-egress');
  changePerspectiveMap.set('your-promise', 'your-resolver');
  changePerspectiveMap.set('your-resolver', 'your-promise');

  function changePerspective(slot) {
    const otherPerspective = changePerspectiveMap.get(slot.type);
    if (otherPerspective === undefined) {
      throw new Error(`slot type ${slot.type} is not an allowed type`);
    }
    return {
      type: otherPerspective,
      id: slot.id,
    };
  }

  function createIncomingWireMessageObj(otherMachineName, youToMeSlot) {
    return {
      otherMachineName,
      youToMeSlot, // could be a your-ingress, your-egress
    };
  }

  function createOutgoingWireMessageObj(otherMachineName, meToYouSlot) {
    return {
      otherMachineName,
      meToYouSlot, // could be a your-ingress, your-egress
    };
  }

  // takes youToMeSlot, returns kernelToMeSlot
  function mapIncomingWireMessageToKernelSlot(otherMachineName, youToMeSlot) {
    return state.get(
      JSON.stringify(
        createIncomingWireMessageObj(otherMachineName, youToMeSlot),
      ),
    );
  }

  // takes kernelToMeSlot, returns meToYouSlot and machineName
  // we don't know the otherMachineName
  function mapKernelSlotToOutgoingWireMessage(kernelToMeSlot) {
    return state.get(JSON.stringify(kernelToMeSlot));
  }

  // kernelToMeSlot can have type: import, export or promise
  // youToMe and meToYou slots can have type: your-ingress or
  // your-egress

  // we will use this in the following ways:
  // 1) to send out information about something that we know as a
  //    kernelToMeSlot - we will need to allocate an id if it doesn't
  //    already exist and then get the 'meToYouSlot' to send over the
  //    wire
  // 2) to translate something that we get over the wire (youToMeSlot)
  //    into a kernelToMeSlot.
  function add(otherMachineName, kernelToMeSlot, youToMeSlot, meToYouSlot) {
    const incomingWireMessageObj = createIncomingWireMessageObj(
      otherMachineName,
      youToMeSlot,
    );
    const outgoingWireMessageObj = createOutgoingWireMessageObj(
      otherMachineName,
      meToYouSlot,
    );
    checkIfAlreadyExists(
      incomingWireMessageObj,
      outgoingWireMessageObj,
      kernelToMeSlot,
    );
    // TODO: serialize these more stably, since JSON will depend on the order
    // in which the properties were added. Maybe `${type}-${id}` or
    // djson.stringify.
    state.set(JSON.stringify(kernelToMeSlot), outgoingWireMessageObj);
    state.set(JSON.stringify(incomingWireMessageObj), kernelToMeSlot);
  }

  return {
    mapIncomingWireMessageToKernelSlot,
    mapKernelSlotToOutgoingWireMessage,
    changePerspective,
    add,
    dump() {
      return state;
    },
  };
}
