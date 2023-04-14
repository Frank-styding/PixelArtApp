#include <cstdlib>
typedef unsigned char uint8_t;
typedef unsigned short uint16_t;
typedef unsigned int uint32_t;

extern "C"
{
    extern void js_draw(int value);
    static uint32_t memorySize = 50;
    static uint8_t *memoryBuffer = new uint8_t[memorySize];

    static uint16_t n_sub_array = 4;
    static uint16_t sub_array_sizes[4] = {10, 10, 20, 10};

    void move_mem(uint32_t start, uint32_t size, uint8_t n_pos)
    {
        if (n_pos + size > memorySize)
        {
            uint8_t *aux = memoryBuffer;

            memoryBuffer = new uint8_t[n_pos + size];

            for (uint32_t i = 0; i < memorySize; i++)
            {
                memoryBuffer[i] = aux[i];
            }

            memorySize = n_pos + size;

            free(aux);
        }

        uint8_t *data = new uint8_t[size];
        for (uint32_t i = 0; i < size; i++)
        {
            data[i] = memoryBuffer[i + start];
            memoryBuffer[i + start] = 0;
        }

        for (uint32_t i = 0; i < size; i++)
        {
            memoryBuffer[i + n_pos] = data[i];
        }

        free(data);
    }

    // Export [number,number] [void]
    void resize_mem(uint16_t idx, uint32_t size)
    {
        uint32_t start_pos = 0;
        uint32_t _size = 0;
        for (uint16_t i = 0; i < n_sub_array; i++)
        {
            if (i <= idx)
            {
                start_pos += sub_array_sizes[i];
            }
            else
            {
                _size += sub_array_sizes[i];
            }
        }

        move_mem(start_pos, _size, start_pos + size - sub_array_sizes[idx]);
        sub_array_sizes[idx] = size;
    }

    // Export [number,number] [number]
    uint8_t read_mem(uint16_t idx1, uint8_t idx2)
    {
        if (idx2 > sub_array_sizes[idx1])
        {
            return NULL;
        }

        uint32_t start_pos = 0;
        for (uint16_t i = 0; i < idx1; i++)
        {
            start_pos += sub_array_sizes[i];
        }

        return memoryBuffer[start_pos + idx2];
    }

    // Export [number,number,number] [void]
    void set_mem(uint16_t idx1, uint8_t idx2, uint8_t value)
    {
        if (idx2 > sub_array_sizes[idx1])
        {
            return;
        }

        uint32_t start_pos = 0;
        for (uint16_t i = 0; i < idx1; i++)
        {
            start_pos += sub_array_sizes[i];
        }

        memoryBuffer[start_pos + idx2] = value;
    }

    // Export [] [number]
    uint8_t *memBufferPointer()
    {
        return memoryBuffer;
    }
}