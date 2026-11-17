/** Port of src/z-queue.c Circular integer queue **/

export type Queue = {
  data: number[]
  size: number
  head: number
  tail: number
}

export const qNew = (size:number): Queue => {
  
  const arr = new Array<number>(size + 1);

  return {
    data: arr,
    size: size + 1,
    head: 0,
    tail: 0,
  };
}

export const qLen = (q: Queue): number => {
  if (q.tail >= q.head) {
    return q.tail - q.head;
  }
  return q.size - q.head + q.tail;
}

export const qPush = (q: Queue, item:number):void => {
  q.data[q.tail] = item;
  q.tail = (q.tail + 1) % q.size;

  if (q.tail === q.head) {
    throw new Error('queue overflow');
  }
}

export const qPop = (q: Queue):number | undefined => {
  const item = q.data[q.head]

  if (q.head === q.tail) {
    throw new Error('queue underflow');
  }

  q.head = (q.head + 1) % q.size
  return item
}

