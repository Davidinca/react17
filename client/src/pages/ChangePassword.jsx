// pages/ChangePassword.jsx
import React from 'react';
import { Toaster } from 'react-hot-toast';
import { useChangePassword } from '../hooks/useChangePassword.js';
import { Card, Label, TextInput, Button } from 'flowbite-react';
import { HiOutlineLockClosed, HiOutlineKey, HiOutlineShieldCheck } from 'react-icons/hi2';

const ChangePassword = () => {
    const {
        register,
        handleSubmit,
        errors,
        isSubmitting,
        onSubmit,
        validationRules
    } = useChangePassword();

    return (
        <div className="min-h-screen flex items-center justify-center py-8 px-4">
            <Toaster position="top-right" />

            <Card className="w-full max-w-md p-6">
                <h1 className="text-2xl font-bold mb-2 text-primary-700 text-center">
                    Cambio de Contraseña
                </h1>
                <p className="text-sm text-gray-600 text-center mb-6">
                    Es obligatorio cambiar tu contraseña para continuar
                </p>

                <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
                    {/* Contraseña Actual */}
                    <div>
                        <div className="mb-2 block">
                            <Label htmlFor="old_password">Contraseña Actual</Label>
                        </div>
                        <TextInput
                            id="old_password"
                            type="password"
                            placeholder="Ingresa tu contraseña actual"
                            icon={HiOutlineLockClosed}
                            className="text-base"
                            {...register('old_password', validationRules.old_password)}
                            color={errors.old_password ? 'failure' : undefined}
                            required
                        />
                        {errors.old_password && (
                            <p className="mt-1 text-xs text-red-500">
                                {errors.old_password.message}
                            </p>
                        )}
                    </div>

                    {/* Nueva Contraseña */}
                    <div>
                        <div className="mb-2 block">
                            <Label htmlFor="new_password">Nueva Contraseña</Label>
                        </div>
                        <TextInput
                            id="new_password"
                            type="password"
                            placeholder="Nueva contraseña (mín. 8 caracteres)"
                            icon={HiOutlineKey}
                            className="text-base"
                            {...register('new_password', validationRules.new_password)}
                            color={errors.new_password ? 'failure' : undefined}
                            required
                        />
                        {errors.new_password && (
                            <p className="mt-1 text-xs text-red-500">
                                {errors.new_password.message}
                            </p>
                        )}
                    </div>

                    {/* Confirmar Nueva Contraseña */}
                    <div>
                        <div className="mb-2 block">
                            <Label htmlFor="confirm_password">Confirmar Nueva Contraseña</Label>
                        </div>
                        <TextInput
                            id="confirm_password"
                            type="password"
                            placeholder="Confirma tu nueva contraseña"
                            icon={HiOutlineShieldCheck}
                            className="text-base"
                            {...register('confirm_password', validationRules.confirm_password)}
                            color={errors.confirm_password ? 'failure' : undefined}
                            required
                        />
                        {errors.confirm_password && (
                            <p className="mt-1 text-xs text-red-500">
                                {errors.confirm_password.message}
                            </p>
                        )}
                    </div>

                    {/* Botón de envío */}
                    <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="bg-primary-500 hover:bg-primary-600 text-base py-3"
                    >
                        {isSubmitting ? 'Procesando...' : 'Cambiar Contraseña'}
                    </Button>
                </form>
            </Card>
        </div>
    );
};

export default ChangePassword;