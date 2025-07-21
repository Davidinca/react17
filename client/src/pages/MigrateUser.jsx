import React from 'react';
import { useForm } from 'react-hook-form';
import { Toaster } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useMigrateUser } from '../hooks/useMigrateUser.js';
import {
    Card,
    Label,
    TextInput,
    Button,
} from 'flowbite-react';
import { HiOutlineUser } from 'react-icons/hi2';

export default function MigrateUser() {
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();
    const navigate = useNavigate();
    const { handleMigrateUser, fieldErrors, clearFieldError } = useMigrateUser();

    return (
        <div className="min-h-screen flex items-center justify-center py-8 px-4">
            <Toaster position="top-right" />

            <Card className="w-full max-w-md p-6">
                <h1 className="text-2xl font-bold mb-6 text-primary-700 text-center">
                    Migrar Usuario
                </h1>

                <form onSubmit={handleSubmit(handleMigrateUser)} className="flex flex-col gap-5">
                    {/* Código Cotel */}
                    <div>
                        <div className="mb-2 block">
                            <Label htmlFor="codigocotel">Código Cotel</Label>
                        </div>
                        <TextInput
                            id="codigocotel"
                            type="text"
                            placeholder="Ingresa tu código"
                            icon={HiOutlineUser}
                            className="text-base"
                            {...register('codigocotel', {
                                required: 'El código Cotel es obligatorio'
                            })}
                            color={errors.codigocotel || fieldErrors.codigocotel ? 'failure' : undefined}
                            onFocus={() => clearFieldError('codigocotel')}
                            required
                        />
                        {(errors.codigocotel || fieldErrors.codigocotel) && (
                            <p className="mt-1 text-xs text-red-500">
                                {errors.codigocotel?.message || fieldErrors.codigocotel}
                            </p>
                        )}
                    </div>

                    {/* Botón Migrar */}
                    <Button
                        type="submit"
                        className="bg-primary-500 hover:bg-primary-600 text-base py-3"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Procesando...' : 'Migrar Usuario'}
                    </Button>
                </form>

                {/* Link a Login - Fuera del formulario */}
                <div className="text-center text-sm text-gray-600 mt-6">
                    ¿Ya migraste tu cuenta?{' '}
                    <span
                        onClick={() => navigate('/')}
                        className="text-primary-600 hover:text-primary-700 font-medium cursor-pointer hover:underline transition-colors duration-200"
                    >
                        Inicia Sesión
                    </span>
                </div>
            </Card>
        </div>
    );
}